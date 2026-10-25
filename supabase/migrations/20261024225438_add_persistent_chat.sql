create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Nova conversa'
    check (char_length(title) between 1 and 120),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  unique (id, user_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (
    char_length(pg_catalog.btrim(content)) between 1 and 4000
  ),
  client_message_id uuid,
  reply_to_message_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  unique (id, user_id, conversation_id),
  foreign key (conversation_id, user_id)
    references public.chat_conversations (id, user_id) on delete cascade,
  foreign key (reply_to_message_id, user_id, conversation_id)
    references public.chat_messages (id, user_id, conversation_id) on delete cascade,
  check (
    (role = 'user' and client_message_id is not null and reply_to_message_id is null)
    or
    (role = 'assistant' and client_message_id is null and reply_to_message_id is not null)
  )
);

create unique index chat_messages_user_request_id_key
  on public.chat_messages (user_id, client_message_id)
  where role = 'user';

create unique index chat_messages_one_reply_per_user_message_key
  on public.chat_messages (reply_to_message_id)
  where role = 'assistant';

create index chat_conversations_user_updated_id_idx
  on public.chat_conversations (user_id, updated_at desc, id desc);

create index chat_messages_conversation_created_id_idx
  on public.chat_messages (conversation_id, created_at desc, id desc);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

revoke all on public.chat_conversations, public.chat_messages from public, anon, authenticated;
grant select, insert, delete on public.chat_conversations to authenticated;
grant update (title, updated_at) on public.chat_conversations to authenticated;
grant select, insert, delete on public.chat_messages to authenticated;
grant select, insert on public.chat_messages to service_role;
grant insert (
  conversation_id,
  user_id,
  role,
  content,
  client_message_id,
  reply_to_message_id
) on public.chat_messages to authenticated;
grant update (content) on public.chat_messages to authenticated;

create policy "Users can read their own chat conversations"
on public.chat_conversations
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own chat conversations"
on public.chat_conversations
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own chat conversations"
on public.chat_conversations
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own chat conversations"
on public.chat_conversations
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own chat messages"
on public.chat_messages
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own user messages"
on public.chat_messages
for insert
to authenticated
with check ((select auth.uid()) = user_id and role = 'user');

create policy "Users can update their own user messages"
on public.chat_messages
for update
to authenticated
using ((select auth.uid()) = user_id and role = 'user')
with check ((select auth.uid()) = user_id and role = 'user');

create policy "Users can delete their own chat messages"
on public.chat_messages
for delete
to authenticated
using ((select auth.uid()) = user_id);