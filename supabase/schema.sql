-- Jalankan seluruh SQL ini di Supabase Dashboard > SQL Editor.
-- Buat bucket private bernama "epub-files" melalui Storage > New bucket,
-- atau jalankan INSERT bucket di bawah jika proyek mengizinkan.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('epub-files', 'epub-files', false, 104857600, array['application/epub+zip','application/octet-stream'])
on conflict (id) do nothing;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text not null default 'Penulis tidak diketahui',
  file_path text not null,
  file_size bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, file_path)
);

create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  cfi text,
  percentage numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, book_id)
);

alter table public.books enable row level security;
alter table public.reading_progress enable row level security;

create policy "Users can read their own books" on public.books
  for select using (auth.uid() = user_id);
create policy "Users can add their own books" on public.books
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own books" on public.books
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own books" on public.books
  for delete using (auth.uid() = user_id);

create policy "Users can read their own progress" on public.reading_progress
  for select using (auth.uid() = user_id);
create policy "Users can add their own progress" on public.reading_progress
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own progress" on public.reading_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own progress" on public.reading_progress
  for delete using (auth.uid() = user_id);

-- Storage: setiap file diletakkan pada folder pertama yang berisi UUID pemilik.
create policy "Users can view own EPUB files" on storage.objects
  for select to authenticated using (
    bucket_id = 'epub-files' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users can upload own EPUB files" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'epub-files' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users can update own EPUB files" on storage.objects
  for update to authenticated using (
    bucket_id = 'epub-files' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'epub-files' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Users can delete own EPUB files" on storage.objects
  for delete to authenticated using (
    bucket_id = 'epub-files' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Tabel Bookmarks (Pembatas Buku)
create table if not exists public.book_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  cfi text not null,
  percentage numeric not null default 0,
  label text,
  snippet text,
  created_at timestamptz not null default now()
);

-- Tabel Highlights (Stabilo)
create table if not exists public.book_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  cfi_range text not null,
  text text not null,
  color text not null default 'yellow',
  label text,
  created_at timestamptz not null default now()
);

alter table public.book_bookmarks enable row level security;
alter table public.book_highlights enable row level security;

create policy "Users can manage own bookmarks" on public.book_bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own highlights" on public.book_highlights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);