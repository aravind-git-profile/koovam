-- ============================================================
-- KOOVAM RIVER RECORD — Supabase setup
-- Run this once in your Supabase project: Dashboard → SQL Editor
-- ============================================================

-- 1. Posts table
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  section    text not null check (section in ('videos','cartoons','media')),
  type       text not null check (type in ('youtube','image','link')),
  src        text not null,
  thumb      text,
  title_en   text,
  title_ta   text,
  desc_en    text,
  desc_ta    text,
  source     text,
  date       date default current_date,
  tags       text[] default '{}',
  created_at timestamptz default now()
);

-- 2. Row Level Security: everyone can read, only signed-in admins can write
alter table public.posts enable row level security;

create policy "public read"
  on public.posts for select
  using (true);

create policy "admin insert"
  on public.posts for insert
  to authenticated
  with check (true);

create policy "admin delete"
  on public.posts for delete
  to authenticated
  using (true);

-- 3. Storage bucket for cartoon/image uploads (public read)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "public read media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "admin upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');

-- ============================================================
-- AFTER RUNNING THIS:
-- 1. Create your admin login: Dashboard → Authentication → Users
--    → Add user → enter your email + a strong password
--    (also turn OFF public sign-ups: Authentication → Providers
--     → Email → disable "Allow new users to sign up")
-- 2. Copy Project URL + anon public key (Settings → API)
--    into assets/config.js
-- ============================================================
