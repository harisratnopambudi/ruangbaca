-- =====================================================================
-- Ruang Bacaan: buka / tutup pendaftaran akun baru dari menu admin.
-- Jalankan seluruh file ini di Supabase SQL Editor. Aman dijalankan ulang.
--
-- - Pengaturan disimpan di public.site_settings (hanya bisa diubah admin lewat RPC).
-- - Saat ditutup, server MENOLAK akun baru (trigger di auth.users), jadi tidak bisa
--   diakali lewat API. Pengguna lama tetap bisa masuk seperti biasa.
-- - Catatan: selama ditutup, "Add user" / undangan dari dashboard Supabase juga ditolak.
-- =====================================================================

create table if not exists public.site_settings (
  id          integer primary key default 1 check (id = 1),
  signup_open boolean not null default true,
  updated_at  timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;

-- Dibaca halaman masuk (tanpa login) untuk menyembunyikan tombol "Daftar"
create or replace function public.get_signup_open()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select signup_open from public.site_settings where id = 1), true)
$$;
revoke all on function public.get_signup_open() from public;
grant execute on function public.get_signup_open() to anon, authenticated;

-- Diubah dari menu admin
create or replace function public.set_signup_open(p_open boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mengubah pengaturan ini.' using errcode = '42501';
  end if;
  update public.site_settings set signup_open = coalesce(p_open, true), updated_at = now() where id = 1;
  return coalesce(p_open, true);
end $$;
revoke all on function public.set_signup_open(boolean) from public, anon;
grant execute on function public.set_signup_open(boolean) to authenticated;

-- Penjaga di server: tolak akun baru saat pendaftaran ditutup
create or replace function public.rb_guard_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce((select signup_open from public.site_settings where id = 1), true) then
    return new;
  end if;
  raise exception 'Pendaftaran akun baru sedang ditutup.' using errcode = 'P0001';
end $$;
revoke all on function public.rb_guard_signup() from public, anon, authenticated;

drop trigger if exists rb_guard_signup on auth.users;
create trigger rb_guard_signup before insert on auth.users
  for each row execute function public.rb_guard_signup();
