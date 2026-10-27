-- =====================================================================
-- Perbaikan #3 QRIS otomatis: format kode pesanan baru (RB-XXXXXXXX-XXXXXX)
-- Kode pesanan kini memakai bagian acak dengan tanda hubung, sama seperti
-- aturan di trg_guard_orders. qris_reserve disesuaikan agar menerimanya.
-- JALANKAN INI SEBELUM mengunggah main.jsx versi 2.2.0.
-- =====================================================================

create or replace function public.qris_reserve(p_code text, p_total integer)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  cfg    public.qris_config;
  r      public.qris_reservations;
  v_code integer;
begin
  if v_uid is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  if p_code is null or p_code !~ '^RB-[A-Z0-9-]{4,40}$' then raise exception 'Kode pesanan tidak valid.'; end if;
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
