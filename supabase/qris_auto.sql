-- =====================================================================
-- Ruang Bacaan: pembayaran QRIS dinamis + deteksi otomatis (tanpa gateway)
-- Jalankan SELURUH file ini di Supabase Dashboard > SQL Editor.
-- Aman dijalankan ulang (idempotent).
--
-- Alur:
--   1. Pembeli checkout -> qris_reserve() memberi nominal unik (mis. Rp10.037)
--   2. create_order() yang sudah ada mencatat pesanan; trigger mengubahnya
--      menjadi status 'awaiting_payment' dengan nominal unik + batas waktu
--   3. Notifikasi "Pembayaran sebesar RpX diterima" dari Shopee Partner
--      diteruskan MacroDroid ke qris_notify() -> pesanan dengan nominal
--      yang sama otomatis di-approve (memakai approve_order yang sudah ada)
--   4. Tidak cocok / gagal -> dicatat dan tampil di ekstensi admin
--
-- SETELAH MENJALANKAN, isi email admin (ganti alamatnya):
--   update public.qris_config set admin_email = 'EMAIL_AKUN_ADMIN' where id = 1;
-- Lalu ambil kunci rahasia untuk MacroDroid:
--   select secret from public.qris_config;
-- =====================================================================

-- ---------- 1. Kolom baru di tabel orders ----------
alter table public.orders add column if not exists pay_amount  integer;
alter table public.orders add column if not exists unique_code integer;
alter table public.orders add column if not exists expires_at  timestamptz;
alter table public.orders add column if not exists paid_at     timestamptz;
alter table public.orders add column if not exists paid_via    text;
alter table public.orders add column if not exists payment_ref text;

create index if not exists orders_pay_amount_active_idx
  on public.orders (pay_amount) where status in ('awaiting_payment', 'pending', 'expired');

-- ---------- 2. Status baru: awaiting_payment (belum bayar) dan expired ----------
do $$
declare r record;
begin
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'orders' and column_name = 'status') = 'USER-DEFINED' then
    raise exception 'Kolom orders.status bertipe enum. Ubah dulu ke text: alter table public.orders alter column status type text;';
  end if;
  for r in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.orders drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'approved', 'rejected', 'awaiting_payment', 'expired'));

-- ---------- 3. Pengaturan (tidak bisa dibaca dari browser) ----------
create table if not exists public.qris_config (
  id              integer primary key default 1 check (id = 1),
  secret          text    not null default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  admin_email     text,
  timeout_minutes integer not null default 30,   -- batas waktu bayar
  grace_minutes   integer not null default 15,   -- toleransi bayar telat
  max_code        integer not null default 199   -- kode unik 1..max_code rupiah
);
insert into public.qris_config (id) values (1) on conflict (id) do nothing;
alter table public.qris_config enable row level security;
revoke all on public.qris_config from anon, authenticated;

-- ---------- 4. Reservasi nominal unik (sebelum pesanan dicatat) ----------
create table if not exists public.qris_reservations (
  code        text primary key,
  user_id     uuid    not null,
  base_total  integer not null,
  unique_code integer not null,
  pay_amount  integer not null,
  created_at  timestamptz not null default now()
);
alter table public.qris_reservations enable row level security;
revoke all on public.qris_reservations from anon, authenticated;

-- ---------- 5. Log notifikasi pembayaran ----------
create table if not exists public.qris_payments (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  amount     integer,
  trx_id     text unique,
  raw_text   text,
  status     text not null,      -- approved | unmatched | error | ignored
  order_id   uuid references public.orders(id) on delete set null,
  order_code text,
  note       text,
  resolved   boolean not null default false
);
create index if not exists qris_payments_open_idx on public.qris_payments (created_at) where not resolved;
alter table public.qris_payments enable row level security;
drop policy if exists "Admin can read payments" on public.qris_payments;
create policy "Admin can read payments" on public.qris_payments
  for select to authenticated using (public.is_admin());
drop policy if exists "Admin can resolve payments" on public.qris_payments;
create policy "Admin can resolve payments" on public.qris_payments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.qris_payments from anon;
grant select, update (resolved) on public.qris_payments to authenticated;

-- ---------- 6. Kedaluwarsakan pesanan yang tidak dibayar ----------
create or replace function public.qris_expire_stale()
returns void language plpgsql security definer set search_path = public as $$
declare cfg public.qris_config;
begin
  select * into cfg from qris_config where id = 1;
  update orders set status = 'expired'
   where status = 'awaiting_payment'
     and expires_at < now() - make_interval(mins => cfg.grace_minutes);
  delete from qris_reservations where created_at < now() - interval '15 minutes';
end $$;
revoke all on function public.qris_expire_stale() from public, anon, authenticated;

-- ---------- 7. Pembeli: minta nominal unik ----------
create or replace function public.qris_reserve(p_code text, p_total integer)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  cfg    public.qris_config;
  r      public.qris_reservations;
  v_code integer;
begin
  if v_uid is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  if p_code is null or p_code !~ '^RB-[A-Z0-9]{4,24}$' then raise exception 'Kode pesanan tidak valid.'; end if;
  if p_total is null or p_total <= 0 or p_total > 10000000 then raise exception 'Total tidak valid.'; end if;

  -- Satu proses pada satu waktu agar dua pembeli tidak mendapat nominal yang sama
  perform pg_advisory_xact_lock(hashtext('rb_qris'));
  perform qris_expire_stale();
  select * into cfg from qris_config where id = 1;

  select * into r from qris_reservations where code = p_code;
  if found then
    if r.user_id <> v_uid or r.base_total <> p_total then raise exception 'Kode pesanan sudah dipakai.'; end if;
  else
    if exists (select 1 from orders where code = p_code) then raise exception 'Kode pesanan sudah dipakai.'; end if;
    select c into v_code
      from generate_series(1, greatest(cfg.max_code, 9)) c
     where not exists (
             select 1 from orders o
              where o.pay_amount = p_total + c
                and (o.status = 'awaiting_payment'
                     or (o.status in ('pending', 'expired') and o.created_at > now() - interval '2 days')))
       and not exists (select 1 from qris_reservations q where q.pay_amount = p_total + c)
     order by random()
     limit 1;
    if v_code is null then raise exception 'Sedang banyak pesanan. Coba lagi dalam beberapa menit.'; end if;
    insert into qris_reservations (code, user_id, base_total, unique_code, pay_amount)
    values (p_code, v_uid, p_total, v_code, p_total + v_code)
    returning * into r;
  end if;

  return json_build_object(
    'code', r.code, 'base_total', r.base_total, 'unique_code', r.unique_code,
    'pay_amount', r.pay_amount, 'timeout_minutes', cfg.timeout_minutes);
end $$;
revoke all on function public.qris_reserve(text, integer) from public, anon;
grant execute on function public.qris_reserve(text, integer) to authenticated;

-- ---------- 8. Trigger: pesanan dengan reservasi -> menunggu pembayaran ----------
create or replace function public.qris_apply_reservation()
returns trigger language plpgsql security definer set search_path = public as $$
declare r public.qris_reservations; cfg public.qris_config;
begin
  select * into r from qris_reservations where code = new.code;
  if not found then return new; end if;               -- pesanan cara lama: tidak diubah
  if r.user_id is distinct from auth.uid() or r.base_total <> new.total then return new; end if;
  select * into cfg from qris_config where id = 1;
  new.status      := 'awaiting_payment';
  new.unique_code := r.unique_code;
  new.pay_amount  := r.pay_amount;
  new.expires_at  := now() + make_interval(mins => cfg.timeout_minutes);
  delete from qris_reservations where code = r.code;
  return new;
end $$;
revoke all on function public.qris_apply_reservation() from public, anon, authenticated;

drop trigger if exists qris_apply_reservation on public.orders;
create trigger qris_apply_reservation before insert on public.orders
  for each row execute function public.qris_apply_reservation();

-- ---------- 9. Pembeli: "sudah bayar tapi belum terdeteksi" -> cek manual admin ----------
create or replace function public.qris_claim_paid(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update orders set status = 'pending'
   where id = p_order_id
     and lower(user_email) = lower(coalesce(auth.email(), auth.jwt() ->> 'email'))
     and status in ('awaiting_payment', 'expired');
  if not found then raise exception 'Pesanan tidak ditemukan atau sudah diproses.'; end if;
end $$;
revoke all on function public.qris_claim_paid(uuid) from public, anon;
grant execute on function public.qris_claim_paid(uuid) to authenticated;

-- ---------- 10. MacroDroid: terima teks notifikasi Shopee Partner ----------
create or replace function public.qris_notify(p_secret text, p_text text, p_title text default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  cfg      public.qris_config;
  v_text   text := btrim(coalesce(p_title, '') || ' ' || coalesce(p_text, ''));
  v_amount integer;
  v_trx    text;
  v_pay    uuid;
  o        public.orders;
  v_admin  uuid;
  v_status text;
  v_note   text;
  -- identitas pemanggil asli, dipulihkan setelah approve atas nama admin
  old_claims text := current_setting('request.jwt.claims', true);
  old_sub    text := current_setting('request.jwt.claim.sub', true);
  old_email  text := current_setting('request.jwt.claim.email', true);
  old_role   text := current_setting('request.jwt.claim.role', true);
begin
  select * into cfg from qris_config where id = 1;
  if p_secret is null or cfg.secret is null or p_secret <> cfg.secret then
    perform pg_sleep(1);  -- perlambat tebakan
    raise exception 'Kunci rahasia salah.' using errcode = '42501';
  end if;

  -- Contoh: "Pembayaran sebesar Rp30.000 telah diterima pada transaksi 151031963573968466."
  if v_text !~* 'diterima' or v_text !~* 'rp' then
    return json_build_object('ok', true, 'status', 'ignored');
  end if;
  v_amount := nullif(regexp_replace(substring(v_text from '[Rr][Pp]\s?([0-9][0-9.,]*)'), '[.,]', '', 'g'), '')::integer;
  v_trx    := substring(v_text from '(?i)transaksi\D{0,5}([0-9]{6,})');
  if v_amount is null then
    return json_build_object('ok', true, 'status', 'ignored');
  end if;

  perform pg_advisory_xact_lock(hashtext('rb_qris'));

  -- Notifikasi yang sama bisa terkirim lebih dari sekali: abaikan duplikat
  if v_trx is not null and exists (select 1 from qris_payments where trx_id = v_trx) then
    return json_build_object('ok', true, 'status', 'duplicate');
  end if;
  if v_trx is null and exists (select 1 from qris_payments
                               where amount = v_amount and trx_id is null and created_at > now() - interval '2 minutes') then
    return json_build_object('ok', true, 'status', 'duplicate');
  end if;

  insert into qris_payments (amount, trx_id, raw_text, status)
  values (v_amount, v_trx, left(v_text, 500), 'unmatched')
  returning id into v_pay;

  -- Cari pesanan dengan nominal persis sama (prioritas: masih aktif > sudah klaim bayar > baru kedaluwarsa)
  select * into o from orders
   where pay_amount = v_amount
     and status in ('awaiting_payment', 'pending', 'expired')
     and created_at > now() - interval '2 days'
     and (status <> 'expired' or expires_at > now() - interval '1 day')
   order by case
              when status = 'awaiting_payment' and expires_at + make_interval(mins => cfg.grace_minutes) > now() then 0
              when status = 'pending' then 1
              else 2
            end,
            created_at desc
   limit 1
   for update;

  if not found then
    -- Mirip pesanan (mis. bayar tanpa kode unik)? -> perlu dicek admin.
    -- Tidak mirip sama sekali (pemasukan lain lewat QRIS yang sama) -> cukup dicatat.
    select * into o from orders
     where status in ('awaiting_payment', 'pending', 'expired')
       and created_at > now() - interval '2 days'
       and v_amount between total and total + greatest(cfg.max_code, 9)
     order by created_at desc
     limit 1;
    if found then
      update qris_payments
         set note = format('Nominal tidak persis. Mungkin pesanan %s (harus Rp%s).', o.code, replace(to_char(coalesce(o.pay_amount, o.total), 'FM999,999,999'), ',', '.')),
             order_code = o.code
       where id = v_pay;
      return json_build_object('ok', true, 'status', 'unmatched', 'amount', v_amount, 'maybe', o.code);
    end if;
    update qris_payments set status = 'ignored', resolved = true,
           note = 'Bukan pembayaran Ruang Bacaan' where id = v_pay;
    return json_build_object('ok', true, 'status', 'ignored', 'amount', v_amount);
  end if;

  update orders set status = 'pending', paid_at = now(), paid_via = 'qris_auto', payment_ref = v_trx
   where id = o.id;

  select id into v_admin from auth.users where lower(email) = lower(cfg.admin_email) limit 1;
  if v_admin is null then
    v_status := 'error';
    v_note := 'admin_email di qris_config belum diisi atau tidak ditemukan';
  else
    begin
      -- Jalankan approve_order yang sudah ada atas nama akun admin
      perform set_config('request.jwt.claims',
        json_build_object('sub', v_admin, 'email', cfg.admin_email, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_admin::text, true);
      perform set_config('request.jwt.claim.email', cfg.admin_email, true);
      perform set_config('request.jwt.claim.role', 'authenticated', true);
      perform public.approve_order(p_order_id => o.id);
      v_status := 'approved';
    exception when others then
      v_status := 'error';
      v_note := sqlerrm;
    end;
    perform set_config('request.jwt.claims', coalesce(old_claims, ''), true);
    perform set_config('request.jwt.claim.sub', coalesce(old_sub, ''), true);
    perform set_config('request.jwt.claim.email', coalesce(old_email, ''), true);
    perform set_config('request.jwt.claim.role', coalesce(old_role, ''), true);
  end if;

  update qris_payments
     set status = v_status, order_id = o.id, order_code = o.code, note = v_note,
         resolved = (v_status = 'approved')
   where id = v_pay;

  return json_build_object('ok', true, 'status', v_status, 'order', o.code, 'amount', v_amount, 'note', v_note);
end $$;
revoke all on function public.qris_notify(text, text, text) from public;
grant execute on function public.qris_notify(text, text, text) to anon, authenticated;

-- Realtime (opsional, sudah aktif jika orders ada di publikasi supabase_realtime):
-- halaman pembeli juga memeriksa status tiap beberapa detik sebagai cadangan.
