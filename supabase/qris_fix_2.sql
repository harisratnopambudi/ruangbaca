-- =====================================================================
-- Perbaikan #2 QRIS otomatis: menyesuaikan dengan trigger pengaman trg_guard_orders.
--
-- trg_guard_orders memaksa pesanan baru berstatus 'pending' dan menolak
-- perubahan status dari non-admin. Fungsi-fungsi QRIS di bawah memakai jalur
-- pengecualian yang sudah ada di pengaman itu (rb.recalc = '1'), hanya selama
-- fungsi itu sendiri berjalan (set_config lokal). Pengguna tidak bisa mengaturnya sendiri.
--
-- Jalankan seluruh file ini di Supabase SQL Editor. Aman dijalankan ulang.
-- =====================================================================

-- 1. Trigger saat INSERT tidak dipakai lagi (selalu ditimpa pengaman).
--    Semua pengaturan nominal unik kini dilakukan qris_attach() setelah total
--    dihitung ulang dari order_items, sehingga nominalnya tidak bisa dimanipulasi.
drop trigger if exists qris_apply_reservation on public.orders;

-- 2. Pasang nominal unik + status 'menunggu pembayaran' setelah create_order selesai
create or replace function public.qris_attach(p_code text)
returns json language plpgsql security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.email(), auth.jwt() ->> 'email'));
  cfg     public.qris_config;
  o       public.orders;
  r       public.qris_reservations;
  v_code  integer;
begin
  perform set_config('rb.recalc', '1', true);  -- jalur pengecualian trg_guard_orders
  if auth.uid() is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;

  perform pg_advisory_xact_lock(hashtext('rb_qris'));
  select * into cfg from qris_config where id = 1;

  select * into o from orders
   where code = p_code and lower(user_email) = v_email
   for update;
  if not found then raise exception 'Pesanan tidak ditemukan.'; end if;

  if o.status = 'awaiting_payment' then
    return json_build_object('status', o.status, 'pay_amount', o.pay_amount);
  end if;

  -- Hanya pesanan QRIS yang baru dibuat (punya reservasi), belum dibayar/diklaim
  select * into r from qris_reservations where code = p_code and user_id = auth.uid();
  if not found
     or o.status <> 'pending' or o.paid_via is not null
     or o.created_at < now() - interval '10 minutes'
     or coalesce(o.total, 0) <= 0 then
    return json_build_object('status', o.status, 'pay_amount', o.pay_amount);
  end if;

  -- Total resmi (hasil hitung ulang server). Pakai kode reservasi jika totalnya sama
  -- dan nominalnya masih bebas; jika tidak, pilih kode unik baru.
  v_code := null;
  if r.base_total = o.total and not exists (
       select 1 from orders x
        where x.id <> o.id and x.pay_amount = o.total + r.unique_code
          and (x.status = 'awaiting_payment'
               or (x.status in ('pending', 'expired') and x.created_at > now() - interval '2 days'))) then
    v_code := r.unique_code;
  end if;
  if v_code is null then
    select c into v_code
      from generate_series(1, greatest(cfg.max_code, 9)) c
     where not exists (
             select 1 from orders x
              where x.id <> o.id and x.pay_amount = o.total + c
                and (x.status = 'awaiting_payment'
                     or (x.status in ('pending', 'expired') and x.created_at > now() - interval '2 days')))
       and not exists (select 1 from qris_reservations q where q.code <> p_code and q.pay_amount = o.total + c)
     order by random()
     limit 1;
  end if;
  if v_code is null then
    return json_build_object('status', o.status, 'pay_amount', null);
  end if;

  delete from qris_reservations where code = p_code;
  update orders
     set status      = 'awaiting_payment',
         unique_code = v_code,
         pay_amount  = o.total + v_code,
         expires_at  = now() + make_interval(mins => cfg.timeout_minutes)
   where id = o.id;

  return json_build_object('status', 'awaiting_payment', 'pay_amount', o.total + v_code);
end $$;
revoke all on function public.qris_attach(text) from public, anon;
grant execute on function public.qris_attach(text) to authenticated;

-- 3. Fungsi QRIS lain yang mengubah status pesanan memakai jalur yang sama
--    (definisi ulang, isinya sama dengan qris_auto.sql + set_config di awal)
create or replace function public.qris_expire_stale()
returns void language plpgsql security definer set search_path = public as $$
declare cfg public.qris_config;
begin
  perform set_config('rb.recalc', '1', true);  -- jalur pengecualian trg_guard_orders
  select * into cfg from qris_config where id = 1;
  update orders set status = 'expired'
   where status = 'awaiting_payment'
     and expires_at < now() - make_interval(mins => cfg.grace_minutes);
  delete from qris_reservations where created_at < now() - interval '15 minutes';
end $$;

create or replace function public.qris_claim_paid(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('rb.recalc', '1', true);  -- jalur pengecualian trg_guard_orders
  update orders set status = 'pending'
   where id = p_order_id
     and lower(user_email) = lower(coalesce(auth.email(), auth.jwt() ->> 'email'))
     and status in ('awaiting_payment', 'expired');
  if not found then raise exception 'Pesanan tidak ditemukan atau sudah diproses.'; end if;
end $$;

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
  perform set_config('rb.recalc', '1', true);  -- jalur pengecualian trg_guard_orders
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

-- 4. Bersihkan pesanan uji coba yang tertahan 'pending' tanpa pembayaran
do $$
begin
  perform set_config('rb.recalc', '1', true);
  update public.orders
     set status = 'expired'
   where status = 'pending'
     and pay_amount is not null
     and paid_via is null
     and created_at > now() - interval '1 day'
     and created_at < now() - interval '5 minutes';
end $$;
