import { supabase } from '../lib/supabase.js';

const CONVERSATION_PAGE_SIZE = 20;
const MESSAGE_PAGE_SIZE = 30;

function requireClient() {
  if (!supabase) {
    throw new Error('O serviço de conversas não está configurado.');
  }
  return supabase;
}

function cursorFilter(cursor, column) {
  return `${column}.lt.${cursor.createdAt},and(${column}.eq.${cursor.createdAt},id.lt.${cursor.id})`;
}

function toConversation(row) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    text: row.content,
    time: new Date(row.created_at),
    replyToMessageId: row.reply_to_message_id,
  };
}

export async function listConversations({ cursor, limit = CONVERSATION_PAGE_SIZE } = {}) {
  let query = requireClient()
    .from('chat_conversations')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (cursor) query = query.or(cursorFilter(cursor, 'updated_at'));
  const { data, error } = await query;
  if (error) throw error;

  const hasMore = data.length > limit;
  const conversations = data.slice(0, limit);
  const last = conversations.at(-1);
  return {
    conversations: conversations.map(toConversation),
    hasMore,
    nextCursor: hasMore && last ? { createdAt: last.updated_at, id: last.id } : null,
  };
}

export async function createConversation() {
  const { data, error } = await requireClient()
    .from('chat_conversations')
    .insert({ title: 'Nova conversa' })
    .select('id, title, created_at, updated_at')
    .single();
  if (error) throw error;
  return toConversation(data);
}

export async function touchConversation(conversationId, firstMessage) {
  const client = requireClient();
  const { data: existing, error: readError } = await client
    .from('chat_conversations')
    .select('title')
    .eq('id', conversationId)
    .single();
  if (readError) throw readError;

  const title = existing.title === 'Nova conversa'
    ? firstMessage.replace(/\s+/g, ' ').trim().slice(0, 72) || 'Nova conversa'
    : existing.title;
  const { data, error } = await client
    .from('chat_conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .select('id, title, created_at, updated_at')
    .single();
  if (error) throw error;
  return toConversation(data);
}

export async function addUserMessage(conversationId, content, clientMessageId) {
  const client = requireClient();
  const { data, error } = await client
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content,
      client_message_id: clientMessageId,
    })
    .select('id, conversation_id, role, content, created_at, reply_to_message_id')
    .single();
  if (error?.code === '23505') {
    const { data: existing, error: lookupError } = await client
      .from('chat_messages')
      .select('id, conversation_id, role, content, created_at, reply_to_message_id')
      .eq('conversation_id', conversationId)
      .eq('client_message_id', clientMessageId)
      .eq('role', 'user')
      .single();
    if (lookupError) throw lookupError;
    return toMessage(existing);
  }
  if (error) throw error;
  return toMessage(data);
}

export async function listMessages(conversationId, { before, limit = MESSAGE_PAGE_SIZE } = {}) {
  let query = requireClient()
    .from('chat_messages')
    .select('id, conversation_id, role, content, created_at, reply_to_message_id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (before) query = query.or(cursorFilter(before, 'created_at'));
  const { data, error } = await query;
  if (error) throw error;

  const hasMore = data.length > limit;
  const page = data.slice(0, limit);
  const oldest = page.at(-1);
  return {
    messages: page.reverse().map(toMessage),
    hasMore,
    nextCursor: hasMore && oldest ? { createdAt: oldest.created_at, id: oldest.id } : null,
  };
}
