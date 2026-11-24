-- Run schema-frame-editor.sql first, then run this file in Supabase SQL Editor.
-- The browser uses only the publishable/anon key. Admin actions are enforced by RLS.

create table if not exists public.frame_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.frame_admins enable row level security;
grant select on public.frame_admins to authenticated;

drop policy if exists "Frame admins can read their own role" on public.frame_admins;
create policy "Frame admins can read their own role"
  on public.frame_admins for select to authenticated
  using (auth.uid() = user_id);

alter table public.frame_templates
  add column if not exists sort_order integer not null default 0;
alter table public.frame_templates
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.is_frame_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.frame_admins
    where user_id = auth.uid()
  );
$$;
revoke all on function public.is_frame_admin() from public;
grant execute on function public.is_frame_admin() to authenticated;

grant select on public.frame_templates to anon, authenticated;
grant insert, update, delete on public.frame_templates to authenticated;

drop policy if exists "Anyone can view active frame templates" on public.frame_templates;
drop policy if exists "Public and admins can view frame templates" on public.frame_templates;
create policy "Public and admins can view frame templates"
  on public.frame_templates for select
  using (is_active = true or public.is_frame_admin());

drop policy if exists "Frame admins create templates" on public.frame_templates;
create policy "Frame admins create templates"
  on public.frame_templates for insert to authenticated
  with check (public.is_frame_admin());

drop policy if exists "Frame admins update templates" on public.frame_templates;
create policy "Frame admins update templates"
  on public.frame_templates for update to authenticated
  using (public.is_frame_admin()) with check (public.is_frame_admin());

drop policy if exists "Frame admins delete templates" on public.frame_templates;
create policy "Frame admins delete templates"
  on public.frame_templates for delete to authenticated
  using (public.is_frame_admin());

drop policy if exists "Frame admins upload template assets" on storage.objects;
create policy "Frame admins upload template assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'frame-templates' and public.is_frame_admin());

drop policy if exists "Frame admins replace template assets" on storage.objects;
create policy "Frame admins replace template assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'frame-templates' and public.is_frame_admin())
  with check (bucket_id = 'frame-templates' and public.is_frame_admin());

drop policy if exists "Frame admins remove template assets" on storage.objects;
create policy "Frame admins remove template assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'frame-templates' and public.is_frame_admin());

-- Optional real-time gallery refresh. Skip safely if the publication is unavailable.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'frame_templates'
     ) then
    alter publication supabase_realtime add table public.frame_templates;
  end if;
end
$$;

-- After creating an Auth account, replace the email below and run this statement once
-- to grant frame management access. Never grant this role through frontend code.
-- insert into public.frame_admins (user_id)
-- select id from auth.users where lower(email) = lower('YOUR_ADMIN_EMAIL')
-- on conflict (user_id) do nothing;
