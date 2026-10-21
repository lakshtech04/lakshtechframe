-- lakhtech: Supabase PostgreSQL schema + Row Level Security
-- Run in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 70),
  category text not null check (category in ('Community','Celebration','Awareness','Culture')),
  description text not null default '',
  frame_storage_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_supports (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_supports enable row level security;

drop policy if exists "Profiles readable by owner" on public.profiles;
create policy "Profiles readable by owner" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users create own profile" on public.profiles;
create policy "Users create own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Published campaigns are public" on public.campaigns;
create policy "Published campaigns are public" on public.campaigns for select using (is_published or auth.uid() = owner_id);
drop policy if exists "Users create own campaigns" on public.campaigns;
create policy "Users create own campaigns" on public.campaigns for insert with check (auth.uid() = owner_id);
drop policy if exists "Owners update own campaigns" on public.campaigns;
create policy "Owners update own campaigns" on public.campaigns for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "Owners delete own campaigns" on public.campaigns;
create policy "Owners delete own campaigns" on public.campaigns for delete using (auth.uid() = owner_id);

drop policy if exists "Support counts visible" on public.campaign_supports;
create policy "Support counts visible" on public.campaign_supports for select using (true);
drop policy if exists "Authenticated users support campaigns" on public.campaign_supports;
create policy "Authenticated users support campaigns" on public.campaign_supports for insert with check (auth.uid() = user_id);
drop policy if exists "Users remove own support" on public.campaign_supports;
create policy "Users remove own support" on public.campaign_supports for delete using (auth.uid() = user_id);

-- Public read access for published frame overlays. Uploads are restricted to
-- authenticated users' own folder: <auth.uid()>/<filename>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('campaign-frames', 'campaign-frames', true, 8388608, array['image/png','image/webp','image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view campaign frames" on storage.objects;
create policy "Public can view campaign frames"
on storage.objects for select
using (bucket_id = 'campaign-frames');

drop policy if exists "Users upload frames to own folder" on storage.objects;
create policy "Users upload frames to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'campaign-frames'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update frames in own folder" on storage.objects;
create policy "Users update frames in own folder"
on storage.objects for update to authenticated
using (bucket_id = 'campaign-frames' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'campaign-frames' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete frames in own folder" on storage.objects;
create policy "Users delete frames in own folder"
on storage.objects for delete to authenticated
using (bucket_id = 'campaign-frames' and (storage.foldername(name))[1] = auth.uid()::text);

-- The frontend keeps personal portrait photos in the browser and does not upload them.
-- Note: if you later upload user portraits, use a separate PRIVATE bucket and stricter policies.
