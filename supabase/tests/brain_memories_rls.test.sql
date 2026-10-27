begin;

select plan(9);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values
  (
    '50000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'jarvis-brain-owner-one@example.test',
    '',
    pg_catalog.now(),
    pg_catalog.now(),
    pg_catalog.now()
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'jarvis-brain-owner-two@example.test',
    '',
    pg_catalog.now(),
    pg_catalog.now(),
    pg_catalog.now()
  );

insert into public.brain_memories (id, user_id, title, content, category)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'Nota privada Jarvis',
    'Uma ideia confidencial da conta um.',
    'note'
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000002',
    'Nota privada Jarvis',
    'Uma ideia confidencial da conta dois.',
    'note'
  );

set local role authenticated;
set local request.jwt.claim.sub = '50000000-0000-4000-8000-000000000001';

select is(
  (select pg_catalog.count(*)::integer from public.brain_memories),
  1,
  'a user sees only their own memories'
);
select lives_ok(
  $$insert into public.brain_memories (title, content, category)
    values ('Nova ideia', 'Uma ideia própria.', 'note')$$,
  'a user can create a memory owned by their JWT identity'
);
select throws_ok(
  $$insert into public.brain_memories (user_id, title, content, category)
    values (
      '50000000-0000-4000-8000-000000000002',
      'Memória alheia',
      'Conteúdo alheio.',
      'note'
    )$$,
  '42501',
  null,
  'a user cannot assign a memory to another account'
);
select is(
  (with changed as (
    update public.brain_memories
    set title = 'Tentativa de alteração cruzada'
    where id = '60000000-0000-4000-8000-000000000002'
    returning 1
  ) select pg_catalog.count(*)::integer from changed),
  0,
  'a user cannot update another account memory'
);
select is(
  (with removed as (
    delete from public.brain_memories
    where id = '60000000-0000-4000-8000-000000000002'
    returning 1
  ) select pg_catalog.count(*)::integer from removed),
  0,
  'a user cannot delete another account memory'
);
select is(
  (with changed as (
    update public.brain_memories
    set content = 'Conteúdo corrigido pela conta um.'
    where id = '60000000-0000-4000-8000-000000000001'
    returning 1
  ) select pg_catalog.count(*)::integer from changed),
  1,
  'a user can update their own memory'
);
select is(
  (select pg_catalog.count(*)::integer
   from public.search_brain_memories('nota privada', 5)),
  1,
  'contextual search returns matching memories owned by the caller'
);
select is(
  (with removed as (
    delete from public.brain_memories
    where id = '60000000-0000-4000-8000-000000000001'
    returning 1
  ) select pg_catalog.count(*)::integer from removed),
  1,
  'a user can delete their own memory'
);
select is(
  (select pg_catalog.count(*)::integer
   from public.search_brain_memories('nota privada', 5)),
  0,
  'a deleted memory is no longer available to contextual search'
);

select * from finish();
rollback;
