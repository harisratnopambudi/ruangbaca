-- =====================================================================
-- Perbaikan #1 QRIS otomatis: create_order menimpa status menjadi 'pending'.
-- Website kini memanggil qris_attach() setelah create_order.
-- Jalankan seluruh file ini di Supabase SQL Editor. Aman dijalankan ulang.
-- =====================================================================

create or replace function public.qris_attach(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(coalesce(auth.email(), auth.jwt() ->> 'email'));
  cfg     public.qris_config;
  o       public.orders;
  r       public.qris_reservations;
begin
  if auth.uid() is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  select * into cfg from qris_config where id = 1;

  select * into o from orders
   where code = p_code and lower(user_email) = v_email
   for update;
  if not found then raise exception 'Pesanan tidak ditemukan.'; end if;

  -- Sudah benar (trigger tidak tertimpa) -> tidak perlu apa-apa
  if o.status = 'awaiting_payment' then
    return json_build_object('status', o.status, 'pay_amount', o.pay_amount);
  end if;

  -- Hanya pesanan baru yang belum dibayar/diklaim yang boleh diubah
  if o.status <> 'pending' or o.paid_via is not null or o.created_at < now() - interval '10 minutes' then
    return json_build_object('status', o.status, 'pay_amount', o.pay_amount);
  end if;

  -- Nominal unik belum terpasang (trigger tidak jalan) -> ambil dari reservasi
  if o.pay_amount is null then
    select * into r from qris_reservations where code = p_code and user_id = auth.uid();
    if not found then
      return json_build_object('status', o.status, 'pay_amount', null);  -- pesanan cara lama
    end if;
    o.unique_code := r.unique_code;
    o.pay_amount  := r.pay_amount;
    delete from qris_reservations where code = p_code;
  end if;

  update orders
     set status = 'awaiting_payment',
         unique_code = o.unique_code,
         pay_amount = o.pay_amount,
         expires_at = now() + make_interval(mins => cfg.timeout_minutes)
   where id = o.id;

  return json_build_object('status', 'awaiting_payment', 'pay_amount', o.pay_amount);
end $$;
revoke all on function public.qris_attach(text) from public, anon;
grant execute on function public.qris_attach(text) to authenticated;

-- Pesanan uji coba yang tertimpa jadi 'pending' tanpa pembayaran -> kedaluwarsa
update public.orders
   set status = 'expired'
 where status = 'pending'
   and pay_amount is not null
   and paid_via is null
   and created_at > now() - interval '1 day'
   and created_at < now() - interval '10 minutes';
