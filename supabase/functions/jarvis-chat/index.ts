import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

const MODEL = Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-4.1-mini"
const MAX_MESSAGE_LENGTH = 4000
const MAX_BODY_BYTES = 2048
const MAX_CONTEXT_MESSAGES = 20
const REQUESTS_PER_MINUTE = 10
const WINDOW_MS = 60_000
const PROVIDER_TIMEOUT_MS = 25_000
const usageByUser = new Map<string, { startedAt: number; count: number }>()

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status })
}

function takeRateLimit(userId: string): boolean {
  const now = Date.now()
  let usage = usageByUser.get(userId)
  if (!usage || now - usage.startedAt >= WINDOW_MS) {
    usage = { startedAt: now, count: 0 }
    usageByUser.set(userId, usage)
  }

  if (usage.count >= REQUESTS_PER_MINUTE) return false
  usage.count += 1

  if (usageByUser.size > 1000) {
    for (const [id, entry] of usageByUser) {
      if (now - entry.startedAt >= WINDOW_MS) usageByUser.delete(id)
    }
  }
  return true
}

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("output" in payload)) return null
  const output = (payload as { output?: unknown }).output
  if (!Array.isArray(output)) return null

  const text = output.flatMap((item) => {
    if (!item || typeof item !== "object" || !("content" in item)) return []
    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) return []
    return content.flatMap((part) => {
      if (
        part && typeof part === "object" && "type" in part &&
        part.type === "output_text" && "text" in part &&
        typeof part.text === "string"
      ) {
        return [part.text]
      }
      return []
    })
  }).join("").trim()

  return text || null
}

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
    const userId = context.userClaims?.id
    if (!userId) {
      return errorResponse(401, "unauthorized", "Entre na sua conta para usar o assistente.")
    }

    if (request.method !== "POST") {
      return errorResponse(405, "method_not_allowed", "Método não permitido.")
    }

    const contentType = request.headers.get("content-type")?.toLowerCase() || ""
    if (!contentType.includes("application/json")) {
      return errorResponse(415, "unsupported_media_type", "Envie a mensagem em formato JSON.")
    }

    const declaredLength = Number(request.headers.get("content-length") || 0)
    if (declaredLength > MAX_BODY_BYTES) {
      return errorResponse(413, "payload_too_large", "A solicitação excede o tamanho permitido.")
    }

    let rawBody: string
    try {
      rawBody = await request.text()
    } catch {
      return errorResponse(400, "invalid_body", "Não foi possível ler a solicitação.")
    }
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return errorResponse(413, "payload_too_large", "A solicitação excede o tamanho permitido.")
    }

    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return errorResponse(400, "invalid_json", "A solicitação JSON é inválida.")
    }
    if (
      !body || typeof body !== "object" ||
      !("conversationId" in body) || typeof body.conversationId !== "string" ||
      !("messageId" in body) || typeof body.messageId !== "string"
    ) {
      return errorResponse(400, "invalid_request", "A conversa e a mensagem são obrigatórias.")
    }

    const { conversationId, messageId } = body
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidPattern.test(conversationId) || !uuidPattern.test(messageId)) {
      return errorResponse(400, "invalid_request", "A conversa ou mensagem informada é inválida.")
    }

    if (!takeRateLimit(userId)) {
      return errorResponse(429, "rate_limited", "Limite de mensagens atingido. Aguarde um minuto e tente novamente.")
    }

    const { data: conversation, error: conversationError } = await context.supabase
      .from("chat_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .maybeSingle()
    if (conversationError) {
      console.error("jarvis-chat: conversation lookup failed")
      return errorResponse(500, "conversation_lookup_failed", "Não foi possível carregar esta conversa.")
    }
    if (!conversation) {
      return errorResponse(404, "conversation_not_found", "Esta conversa não está disponível.")
    }

    const { data: userMessage, error: messageError } = await context.supabase
      .from("chat_messages")
      .select("id, content, created_at")
      .eq("id", messageId)
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .eq("role", "user")
      .maybeSingle()
    if (messageError) {
      console.error("jarvis-chat: message lookup failed")
      return errorResponse(500, "message_lookup_failed", "Não foi possível carregar esta mensagem.")
    }
    if (!userMessage) {
      return errorResponse(404, "message_not_found", "Esta mensagem não está disponível.")
    }
    if (!userMessage.content.trim() || userMessage.content.length > MAX_MESSAGE_LENGTH) {
      return errorResponse(400, "invalid_message", "A mensagem deve ter entre 1 e 4000 caracteres.")
    }

    const findExistingReply = async () => {
      const { data, error } = await context.supabase
        .from("chat_messages")
        .select("id, content, created_at")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .eq("role", "assistant")
        .eq("reply_to_message_id", messageId)
        .maybeSingle()
      if (error) throw error
      return data
    }

    const touchConversation = async () => {
      const { error } = await context.supabase
        .from("chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId)
        .eq("user_id", userId)
      if (error) throw error
    }

    let existingReply
    try {
      existingReply = await findExistingReply()
    } catch {
      console.error("jarvis-chat: existing reply lookup failed")
      return errorResponse(500, "reply_lookup_failed", "Não foi possível carregar a resposta.")
    }
    if (existingReply) {
      try {
        await touchConversation()
      } catch {
        console.error("jarvis-chat: conversation timestamp update failed")
        return errorResponse(500, "conversation_update_failed", "Não foi possível atualizar a conversa.")
      }
      return Response.json({
        message: {
          id: existingReply.id,
          content: existingReply.content,
          created_at: existingReply.created_at,
        },
      })
    }

    const { data: recentMessages, error: historyError } = await context.supabase
      .from("chat_messages")
      .select("id, role, content")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(MAX_CONTEXT_MESSAGES)
    if (historyError) {
      console.error("jarvis-chat: conversation history lookup failed")
      return errorResponse(500, "history_lookup_failed", "Não foi possível carregar o contexto da conversa.")
    }
    if (recentMessages?.[0]?.id !== messageId) {
      return errorResponse(409, "message_not_latest", "Reabra a conversa antes de tentar responder esta mensagem.")
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY")
    if (!apiKey) {
      console.error("jarvis-chat: OPENAI_API_KEY is not configured")
      return errorResponse(503, "service_unavailable", "O assistente está temporariamente indisponível.")
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)
    try {
      const providerResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          instructions: "Você é o assistente Jarvis. Responda em português, de forma clara, segura e concisa. Use apenas o contexto desta conversa. Não afirme que executou ações ou acessou dados que não foram fornecidos.",
          input: recentMessages.reverse().map(({ role, content }) => ({ role, content })),
          max_output_tokens: 800,
          store: false,
        }),
        signal: controller.signal,
      })

      if (providerResponse.status === 429) {
        return errorResponse(429, "provider_rate_limited", "O serviço de IA está ocupado. Aguarde e tente novamente.")
      }
      if (!providerResponse.ok) {
        console.error("jarvis-chat: provider request failed", { status: providerResponse.status })
        return errorResponse(502, "provider_error", "Não foi possível obter uma resposta agora.")
      }

      const payload: unknown = await providerResponse.json()
      const reply = extractOutputText(payload)
      if (!reply) {
        console.error("jarvis-chat: provider returned no output text")
        return errorResponse(502, "invalid_provider_response", "O serviço de IA retornou uma resposta inválida.")
      }
      if (reply.length > MAX_MESSAGE_LENGTH) {
        console.error("jarvis-chat: provider output exceeded the message limit")
        return errorResponse(502, "invalid_provider_response", "O serviço de IA retornou uma resposta acima do limite.")
      }

      const { data: assistantMessage, error: insertError } = await context.supabaseAdmin
        .from("chat_messages")
        .insert({
          conversation_id: conversation.id,
          user_id: userId,
          role: "assistant",
          content: reply,
          reply_to_message_id: messageId,
        })
        .select("id, content, created_at")
        .single()
      if (insertError) {
        if (insertError.code === "23505") {
          try {
            const duplicateReply = await findExistingReply()
            if (duplicateReply) {
              await touchConversation()
              return Response.json({
                message: {
                  id: duplicateReply.id,
                  content: duplicateReply.content,
                  created_at: duplicateReply.created_at,
                },
              })
            }
          } catch {
            console.error("jarvis-chat: duplicate reply lookup failed")
          }
        }
        console.error("jarvis-chat: assistant message persistence failed")
        return errorResponse(500, "message_persistence_failed", "Não foi possível salvar a resposta.")
      }

      try {
        await touchConversation()
      } catch {
        console.error("jarvis-chat: conversation timestamp update failed")
        return errorResponse(500, "conversation_update_failed", "A resposta foi gerada, mas não foi possível atualizar a conversa.")
      }

      return Response.json({
        message: {
          id: assistantMessage.id,
          content: assistantMessage.content,
          created_at: assistantMessage.created_at,
        },
      })
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError"
      if (!timedOut) console.error("jarvis-chat: provider request failed unexpectedly")
      return errorResponse(
        timedOut ? 504 : 502,
        timedOut ? "provider_timeout" : "provider_error",
        timedOut ? "A resposta demorou demais. Tente novamente." : "Não foi possível obter uma resposta agora.",
      )
    } finally {
      clearTimeout(timeout)
    }
  }),
}
