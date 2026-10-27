import { supabase } from '../lib/supabase.js';

const PAGE_SIZE = 25;
const CATEGORIES = new Set(['note', 'memory', 'project', 'decision']);
const PROVENANCE = new Set(['user', 'document', 'ai_confirmed']);

function requireClient(userId) {
  if (!supabase) {
    throw new Error('O serviço de memórias não está configurado.');
  }
  if (!userId) {
    throw new Error('Sua sessão não está válida. Entre novamente para continuar.');
  }
  return supabase;
}

function validateMemory(input) {
  const title = input.title?.trim();
  const content = input.content?.trim();
  const category = input.category;
  const provenance = input.provenance;
  const source = input.source?.trim() || null;

  if (!title || title.length > 160 || !content || content.length > 10000) {
    throw new Error('Informe um título e um conteúdo de até 10.000 caracteres.');
  }
  if (!CATEGORIES.has(category) || !PROVENANCE.has(provenance)) {
    throw new Error('A categoria ou a origem informada não é válida.');
  }
  if (source && source.length > 120) {
    throw new Error('A origem deve ter no máximo 120 caracteres.');
  }

  return { title, content, category, provenance, source };
}

function toMemory(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    provenance: row.provenance,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBrainMemories(userId, { query = '', category = 'all', page = 0 } = {}) {
  let request = requireClient(userId)
    .from('brain_memories')
    .select('id, title, content, category, provenance, source, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (category !== 'all') request = request.eq('category', category);
  if (query.trim()) {
    request = request.textSearch('search_vector', query.trim(), {
      config: 'portuguese',
      type: 'websearch',
    });
  }

  const { data, error } = await request;
  if (error) throw error;

  const rows = data || [];
  return {
    memories: rows.slice(0, PAGE_SIZE).map(toMemory),
    hasMore: rows.length > PAGE_SIZE,
  };
}

export async function createBrainMemory(userId, input) {
  const { data, error } = await requireClient(userId)
    .from('brain_memories')
    .insert(validateMemory(input))
    .select('id, title, content, category, provenance, source, created_at, updated_at')
    .single();
  if (error) throw error;
  return toMemory(data);
}

export async function updateBrainMemory(userId, memoryId, input) {
  const { data, error } = await requireClient(userId)
    .from('brain_memories')
    .update(validateMemory(input))
    .eq('id', memoryId)
    .eq('user_id', userId)
    .select('id, title, content, category, provenance, source, created_at, updated_at')
    .single();
  if (error) throw error;
  return toMemory(data);
}

export async function deleteBrainMemory(userId, memoryId) {
  const { data, error } = await requireClient(userId)
    .from('brain_memories')
    .delete()
    .eq('id', memoryId)
    .eq('user_id', userId)
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}
