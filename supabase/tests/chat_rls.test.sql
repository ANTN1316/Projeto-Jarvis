begin;

select plan(15);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at
) values
  (
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'jarvis-chat-owner-one@example.test',
    '',
    pg_catalog.now(),
    pg_catalog.now(),
    pg_catalog.now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'jarvis-chat-owner-two@example.test',
    '',
    pg_catalog.now(),
    pg_catalog.now(),
    pg_catalog.now()
  );

insert into public.chat_conversations (id, user_id, title) values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Conta um'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'Conta dois'
  );

insert into public.chat_messages (
  id, conversation_id, user_id, role, content, client_message_id
) values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'user',
    'Mensagem privada da conta um',
    '40000000-0000-4000-8000-000000000001'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'user',
    'Mensagem privada da conta dois',
    '40000000-0000-4000-8000-000000000002'
  );

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';

select is(
  (select pg_catalog.count(*)::integer from public.chat_conversations),
  1,
  'a user sees only their conversations'
);
select is(
  (select pg_catalog.count(*)::integer from public.chat_messages),
  1,
  'a user sees only their messages'
);
select lives_ok(
  $$insert into public.chat_conversations (title) values ('Conversa própria')$$,
  'a user can create a conversation owned by their JWT identity'
);
select throws_ok(
  $$insert into public.chat_conversations (user_id, title)
    values ('10000000-0000-4000-8000-000000000002', 'Conversa alheia')$$,
  '42501',
  null,
  'a user cannot create a conversation for another account'
);
select is(
  (with changed as (
    update public.chat_conversations
    set title = 'Título atualizado'
    where id = '20000000-0000-4000-8000-000000000001'
    returning 1
  ) select pg_catalog.count(*)::integer from changed),
  1,
  'a user can update their conversation'
);
select is(
  (with changed as (
    update public.chat_conversations
    set title = 'Acesso cruzado'
    where id = '20000000-0000-4000-8000-000000000002'
    returning 1
  ) select pg_catalog.count(*)::integer from changed),
  0,
  'a user cannot update another account conversation'
);
select is(
  (with removed as (
    delete from public.chat_conversations
    where id = '20000000-0000-4000-8000-000000000002'
    returning 1
  ) select pg_catalog.count(*)::integer from removed),
  0,
  'a user cannot delete another account conversation'
);
select lives_ok(
  $$insert into public.chat_messages (conversation_id, role, content, client_message_id)
    values (
      '20000000-0000-4000-8000-000000000001',
      'user',
      'Nova mensagem própria',
      '40000000-0000-4000-8000-000000000003'
    )$$,
  'a user can insert a message in their conversation'
);
select throws_ok(
  $$insert into public.chat_messages (
      conversation_id, role, content, reply_to_message_id
    ) values (
      '20000000-0000-4000-8000-000000000001',
      'assistant',
      'Resposta fabricada pelo cliente',
      '30000000-0000-4000-8000-000000000001'
    )$$,
  '42501',
  null,
  'a user cannot insert assistant messages'
);
select throws_ok(
  $$insert into public.chat_messages (
      conversation_id, role, content, client_message_id
    ) values (
      '20000000-0000-4000-8000-000000000002',
      'user',
      'Mensagem em conversa alheia',
      '40000000-0000-4000-8000-000000000004'
    )$$,
  '23503',
  null,
  'a user cannot attach their message to another account conversation'
);
select is(
  (with changed as (
    update public.chat_messages
    set content = 'Tentativa de alteração cruzada'
    where id = '30000000-0000-4000-8000-000000000002'
    returning 1
  ) select pg_catalog.count(*)::integer from changed),
  0,
  'a user cannot update another account message'
);
select is(
  (with removed as (
    delete from public.chat_messages
    where id = '30000000-0000-4000-8000-000000000002'
    returning 1
  ) select pg_catalog.count(*)::integer from removed),
  0,
  'a user cannot delete another account message'
);
select is(
  (with changed as (
    update public.chat_messages
    set content = 'Mensagem própria atualizada'
    where id = '30000000-0000-4000-8000-000000000001'
    returning 1
  ) select pg_catalog.count(*)::integer from changed),
  1,
  'a user can update their own user message'
);
select is(
  (with removed as (
    delete from public.chat_messages
    where id = '30000000-0000-4000-8000-000000000001'
    returning 1
  ) select pg_catalog.count(*)::integer from removed),
  1,
  'a user can delete their own message'
);
select is(
  (with removed as (
    delete from public.chat_conversations
    where id = '20000000-0000-4000-8000-000000000001'
    returning 1
  ) select pg_catalog.count(*)::integer from removed),
  1,
  'a user can delete their own conversation'
);

select * from finish();
rollback;
