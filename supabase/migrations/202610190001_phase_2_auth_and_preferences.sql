create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  avatar_url text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  theme text not null default 'dark' check (theme = 'dark'),
  accent_color text not null default 'blue' check (accent_color in ('blue', 'green', 'violet', 'red')),
  language text not null default 'pt-BR',
  voice_enabled boolean not null default false,
  sound_enabled boolean not null default false,
  reduced_motion boolean not null default false,
  intensity integer not null default 65 check (intensity between 0 and 100),
  particles boolean not null default true,
  density text not null default 'comfortable' check (density in ('comfortable', 'compact')),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'display_name'), ''), 'Usuário Jarvis')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.user_preferences from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
grant select on public.user_preferences to authenticated;
grant insert (
  user_id,
  theme,
  accent_color,
  language,
  voice_enabled,
  sound_enabled,
  reduced_motion,
  intensity,
  particles,
  density
) on public.user_preferences to authenticated;
grant update (
  theme,
  accent_color,
  language,
  voice_enabled,
  sound_enabled,
  reduced_motion,
  intensity,
  particles,
  density
) on public.user_preferences to authenticated;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can read their own preferences"
on public.user_preferences
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own preferences"
on public.user_preferences
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own preferences"
on public.user_preferences
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
