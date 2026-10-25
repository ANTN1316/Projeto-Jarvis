import { supabase } from '../lib/supabase.js';

const ERROR_MESSAGES = {
  unauthorized: 'Sua sessão não está válida. Entre novamente para continuar.',
  invalid_message: 'A mensagem deve ter entre 1 e 4000 caracteres.',
  invalid_request: 'A conversa ou mensagem não é válida. Atualize o histórico e tente novamente.',
  message_not_latest: 'Esta mensagem não é mais a última da conversa. Reabra o histórico e tente novamente.',
  message_not_found: 'A mensagem não está disponível nesta conversa.',
  conversation_not_found: 'A conversa não está disponível para esta conta.',
  message_persistence_failed: 'A resposta não pôde ser salva. Tente novamente.',
  conversation_update_failed: 'A resposta foi salva, mas a conversa não pôde ser atualizada. Tente novamente.',
  rate_limited: 'Você atingiu o limite temporário de mensagens. Aguarde um minuto.',
  provider_rate_limited: 'O serviço de IA está ocupado. Aguarde e tente novamente.',
  provider_timeout: 'A resposta demorou demais. Tente novamente.',
  provider_error: 'Não foi possível obter uma resposta agora.',
  service_unavailable: 'O assistente ainda não está configurado no servidor.',
};

export async function sendAssistantMessage({ conversationId, messageId }, { signal } = {}) {
  if (!supabase) {
    throw new Error('O serviço de autenticação não está configurado.');
  }

  const { data, error } = await supabase.functions.invoke('jarvis-chat', {
    body: { conversationId, messageId },
    signal,
    timeout: 35_000,
  });

  if (error) {
    let code = '';
    if (error.context instanceof Response) {
      try {
        const payload = await error.context.clone().json();
        code = payload?.error?.code || '';
      } catch {
        code = '';
      }
    }
    throw new Error(ERROR_MESSAGES[code] || 'Não foi possível conectar ao assistente. Tente novamente.');
  }

  if (
    typeof data?.message?.id !== 'string'
    || typeof data.message.content !== 'string'
    || !data.message.content.trim()
    || typeof data.message.created_at !== 'string'
  ) {
    throw new Error('O assistente retornou uma resposta inválida.');
  }
  return {
    id: data.message.id,
    role: 'assistant',
    text: data.message.content.trim(),
    time: new Date(data.message.created_at),
    replyToMessageId: messageId,
  };
}
