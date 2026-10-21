-- Run in Supabase SQL Editor. Events are public via unguessable slugs; do not store private data here.
create extension if not exists pgcrypto;
create table if not exists public.frame_events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null default encode(gen_random_bytes(8), 'hex'),
  title text not null check (char_length(title) between 1 and 100),
  frame_id text not null default 'green',
  owner_id uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.frame_submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.frame_events(id) on delete cascade,
  photo_path text,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.frame_events enable row level security;
alter table public.frame_submissions enable row level security;
-- Public visitors can view active event details. Only authenticated owners can manage their own events.
drop policy if exists "Public can view active events" on public.frame_events;
create policy "Public can view active events" on public.frame_events for select using (is_active = true);
drop policy if exists "Owners can create events" on public.frame_events;
create policy "Owners can create events" on public.frame_events for insert to authenticated with check (auth.uid() = owner_id);
drop policy if exists "Owners can update events" on public.frame_events;
create policy "Owners can update events" on public.frame_events for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "Owners can delete events" on public.frame_events;
create policy "Owners can delete events" on public.frame_events for delete to authenticated using (auth.uid() = owner_id);
-- Visitors can submit a record only for active events. Configure Storage policies before accepting real photos.
drop policy if exists "Visitors can submit to active events" on public.frame_submissions;
create policy "Visitors can submit to active events" on public.frame_submissions for insert to anon, authenticated with check (exists (select 1 from public.frame_events e where e.id = event_id and e.is_active = true));
drop policy if exists "Owners can view event submissions" on public.frame_submissions;
create policy "Owners can view event submissions" on public.frame_submissions for select to authenticated using (exists (select 1 from public.frame_events e where e.id = event_id and e.owner_id = auth.uid()));
