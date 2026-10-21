-- Lakshtech Frame Editor: Supabase database + storage policies
create extension if not exists pgcrypto;

create table if not exists public.frame_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  slug text unique not null,
  category text not null default 'Community',
  description text not null default '',
  overlay_path text not null,
  preview_path text,
  canvas_width integer not null default 1080 check (canvas_width between 100 and 6000),
  canvas_height integer not null default 1080 check (canvas_height between 100 and 6000),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_frame_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.frame_templates(id) on delete set null,
  title text not null default 'My Design' check (char_length(title) <= 120),
  design_json jsonb not null default '{}'::jsonb,
  export_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_frame_designs_user_updated_idx
  on public.user_frame_designs(user_id, updated_at desc);

alter table public.frame_templates enable row level security;
alter table public.user_frame_designs enable row level security;

drop policy if exists "Anyone can view active frame templates" on public.frame_templates;
create policy "Anyone can view active frame templates" on public.frame_templates
  for select using (is_active = true);

drop policy if exists "Users view own saved designs" on public.user_frame_designs;
create policy "Users view own saved designs" on public.user_frame_designs
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users create own saved designs" on public.user_frame_designs;
create policy "Users create own saved designs" on public.user_frame_designs
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users update own saved designs" on public.user_frame_designs;
create policy "Users update own saved designs" on public.user_frame_designs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users delete own saved designs" on public.user_frame_designs;
create policy "Users delete own saved designs" on public.user_frame_designs
  for delete to authenticated using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('frame-templates', 'frame-templates', true, 12582912, array['image/png','image/webp','image/jpeg']),
  ('user-design-exports', 'user-design-exports', false, 15728640, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

drop policy if exists "Public can read frame template assets" on storage.objects;
create policy "Public can read frame template assets" on storage.objects
  for select using (bucket_id = 'frame-templates');

drop policy if exists "Users upload own design exports" on storage.objects;
create policy "Users upload own design exports" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'user-design-exports' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Users read own design exports" on storage.objects;
create policy "Users read own design exports" on storage.objects
  for select to authenticated using (
    bucket_id = 'user-design-exports' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Users update own design exports" on storage.objects;
create policy "Users update own design exports" on storage.objects
  for update to authenticated using (
    bucket_id = 'user-design-exports' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'user-design-exports' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Users delete own design exports" on storage.objects;
create policy "Users delete own design exports" on storage.objects
  for delete to authenticated using (
    bucket_id = 'user-design-exports' and (storage.foldername(name))[1] = auth.uid()::text
  );
