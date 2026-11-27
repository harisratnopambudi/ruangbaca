-- =====================================================================
-- Admin bisa menerima pesanan secara manual walaupun statusnya masih
-- "Belum dibayar" (awaiting_payment) atau sudah "Kedaluwarsa" (expired).
-- Dipakai saat pembeli sudah membayar tetapi pembayaran tidak terdeteksi
-- otomatis, misalnya nominal dibulatkan atau dibayar setelah waktu habis.
--
-- Hanya admin yang bisa menjalankannya. Perilaku untuk pesanan berstatus
-- 'pending' (termasuk persetujuan otomatis QRIS) tidak berubah.
--
-- Jalankan seluruh file ini di Supabase SQL Editor. Aman dijalankan ulang.
-- =====================================================================

create or replace function public.approve_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_status text;
begin
  if not public.is_admin() then raise exception 'Hanya admin yang dapat menerima pesanan'; end if;

  select status into v_status from public.orders where id = p_order_id for update;
  if not found or v_status not in ('pending', 'awaiting_payment', 'expired') then
    raise exception 'Pesanan tidak ditemukan atau sudah diproses';
  end if;

  -- Pesanan yang belum terdeteksi lunas: tandai lunas manual oleh admin dulu
  if v_status <> 'pending' then
    perform set_config('rb.recalc', '1', true);  -- jalur pengecualian trg_guard_orders, hanya di transaksi ini
    update public.orders
       set status = 'pending',
           paid_at = coalesce(paid_at, now()),
           paid_via = coalesce(paid_via, 'manual')
     where id = p_order_id;
    perform set_config('rb.recalc', '', true);
  end if;

  insert into public.book_access (book_id, user_email, granted_by)
  select oi.book_id, lower(o.user_email), auth.uid()
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.id = p_order_id and oi.book_id is not null
  on conflict (book_id, user_email) do nothing;

  update public.orders
  set status = 'approved', decided_at = now(), decided_by = auth.uid()
  where id = p_order_id;
end $function$;
