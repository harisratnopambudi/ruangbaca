-- =====================================================================
-- Ruang Bacaan: buka / tutup pembelian ebook di katalog dari menu admin.
-- Jalankan seluruh file ini di Supabase SQL Editor. Aman dijalankan ulang.
--
-- - Saat ditutup, server MENOLAK pesanan baru (trigger di public.orders dan
--   public.qris_reservations), jadi tidak bisa diakali lewat API.
-- - Pesanan yang sudah dibuat tetap bisa dibayar dan dikonfirmasi seperti biasa.
-- =====================================================================

create table if not exists public.site_settings (
  id          integer primary key default 1 check (id = 1),
  signup_open boolean not null default true,
  updated_at  timestamptz not null default now()
);
alter table public.site_settings add column if not exists purchase_open boolean not null default true;
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;

-- Dibaca aplikasi untuk menyembunyikan tombol pesan
create or replace function public.get_purchase_open()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select purchase_open from public.site_settings where id = 1), true)
$$;
revoke all on function public.get_purchase_open() from public;
grant execute on function public.get_purchase_open() to anon, authenticated;

-- Diubah dari menu admin
create or replace function public.set_purchase_open(p_open boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mengubah pengaturan ini.' using errcode = '42501';
  end if;
  update public.site_settings set purchase_open = coalesce(p_open, true), updated_at = now() where id = 1;
  return coalesce(p_open, true);
end $$;
revoke all on function public.set_purchase_open(boolean) from public, anon;
grant execute on function public.set_purchase_open(boolean) to authenticated;

-- Penjaga di server: tolak pesanan baru saat pembelian ditutup (admin dikecualikan)
create or replace function public.rb_guard_purchase()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce((select purchase_open from public.site_settings where id = 1), true) or public.is_admin() then
    return new;
  end if;
  raise exception 'Pembelian ebook sedang ditutup sementara.' using errcode = 'P0001';
end $$;
revoke all on function public.rb_guard_purchase() from public, anon, authenticated;

drop trigger if exists rb_guard_purchase on public.orders;
create trigger rb_guard_purchase before insert on public.orders
  for each row execute function public.rb_guard_purchase();

do $$ begin
  if to_regclass('public.qris_reservations') is not null then
    execute 'drop trigger if exists rb_guard_purchase on public.qris_reservations';
    execute 'create trigger rb_guard_purchase before insert on public.qris_reservations
             for each row execute function public.rb_guard_purchase()';
  end if;
end $$;
