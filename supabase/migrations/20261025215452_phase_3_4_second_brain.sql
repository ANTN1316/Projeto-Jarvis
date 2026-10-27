create table public.brain_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(pg_catalog.btrim(title)) between 1 and 160),
  content text not null check (char_length(pg_catalog.btrim(content)) between 1 and 10000),
  category text not null check (category in ('note', 'memory', 'project', 'decision')),
  provenance text not null default 'user'
    check (provenance in ('user', 'document', 'ai_confirmed')),
  source text check (source is null or char_length(source) <= 120),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  search_vector pg_catalog.tsvector generated always as (
    pg_catalog.to_tsvector(
      'pg_catalog.portuguese'::pg_catalog.regconfig,
      title || ' ' || content
    )
  ) stored
);

create index brain_memories_user_updated_id_idx
  on public.brain_memories (user_id, updated_at desc, id desc);
create index brain_memories_user_category_updated_id_idx
  on public.brain_memories (user_id, category, updated_at desc, id desc);
create index brain_memories_search_vector_idx
  on public.brain_memories using gin (search_vector);

create function public.set_brain_memory_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger brain_memories_set_updated_at
before update on public.brain_memories
for each row execute function public.set_brain_memory_updated_at();

revoke all on function public.set_brain_memory_updated_at() from public, anon, authenticated;

create function public.search_brain_memories(search_query text, result_limit integer default 5)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  provenance text,
  source text,
  updated_at timestamptz,
  relevance real
)
language sql
stable
set search_path = ''
as $$
  with query as (
    select pg_catalog.websearch_to_tsquery(
      'pg_catalog.portuguese'::pg_catalog.regconfig,
      search_query
    ) as term
  )
  select
    memory.id,
    memory.title,
    pg_catalog.left(memory.content, 1000),
    memory.category,
    memory.provenance,
    memory.source,
    memory.updated_at,
    pg_catalog.ts_rank_cd(memory.search_vector, query.term) as relevance
  from public.brain_memories as memory
  cross join query
  where memory.user_id = (select auth.uid())
    and memory.search_vector @@ query.term
  order by relevance desc, memory.updated_at desc, memory.id desc
  limit pg_catalog.least(pg_catalog.greatest(result_limit, 1), 5);
$$;

revoke all on function public.search_brain_memories(text, integer) from public, anon, authenticated;
grant execute on function public.search_brain_memories(text, integer) to authenticated;

alter table public.brain_memories enable row level security;

revoke all on public.brain_memories from public, anon, authenticated;
grant select, delete on public.brain_memories to authenticated;
grant insert (title, content, category, provenance, source) on public.brain_memories to authenticated;
grant update (title, content, category, provenance, source) on public.brain_memories to authenticated;

create policy "Users can read their own brain memories"
on public.brain_memories
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own brain memories"
on public.brain_memories
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own brain memories"
on public.brain_memories
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own brain memories"
on public.brain_memories
for delete
to authenticated
using ((select auth.uid()) = user_id);