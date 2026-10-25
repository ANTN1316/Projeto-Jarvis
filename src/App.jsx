import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ACCENTS, DEFAULT_PREFERENCES, MODULES, NAV_ITEMS } from './data.js';
import {
  BrainView, CoreView, Hud, Icon, LogView, ModulesView, Navigation, SettingsView,
} from './components.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { loadPreferences, savePreferences, signOut } from './services/userData.js';
import { sendAssistantMessage } from './services/assistant.js';
import { addUserMessage, createConversation, listConversations, listMessages, touchConversation } from './services/chat.js';

const MAX_MESSAGE_LENGTH = 4000;

const transitions = {
  idle: ['listening', 'thinking', 'error'],
  listening: ['idle', 'thinking', 'error'],
  thinking: ['speaking', 'success', 'error', 'idle'],
  speaking: ['success', 'idle', 'error'],
  success: ['idle', 'listening', 'thinking'],
  error: ['idle', 'listening', 'thinking'],
};

function reactorReducer(state, next) {
  if (state === next || !transitions[state]?.includes(next)) return state;
  return next;
}

function readPreferences() {
  try {
    const stored = window.localStorage.getItem('jarvis.preferences');
    if (!stored) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(stored);
    const accent = Object.hasOwn(ACCENTS, parsed.accent) ? parsed.accent : DEFAULT_PREFERENCES.accent;
    return {
      intensity: Number.isFinite(parsed.intensity) ? Math.min(100, Math.max(0, parsed.intensity)) : DEFAULT_PREFERENCES.intensity,
      particles: typeof parsed.particles === 'boolean' ? parsed.particles : DEFAULT_PREFERENCES.particles,
      reducedMotion: typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : DEFAULT_PREFERENCES.reducedMotion,
      accent,
      density: parsed.density === 'compact' ? 'compact' : DEFAULT_PREFERENCES.density,
    };
  } catch (error) {
    console.warn('Não foi possível carregar as preferências locais do Jarvis.', error);
    return DEFAULT_PREFERENCES;
  }
}

function normalizeCommand(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[.!?,]/g, '').trim();
}

function getCommandResult(command) {
  const normalized = normalizeCommand(command);
  if (/abrir second brain|second brain/.test(normalized)) {
    return { route: 'brain' };
  }
  if (/mostrar modulos|abrir modulos|modulos/.test(normalized)) {
    return { route: 'modules' };
  }
  if (/abrir configuracoes|configuracoes|settings/.test(normalized)) {
    return { route: 'settings' };
  }
  if (/voltar ao nucleo|voltar para o nucleo|abrir core/.test(normalized)) {
    return { route: 'core' };
  }
  return null;
}

function createEvent(category, description, level = 'INFO') {
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, time: new Date(), category, description, level };
}

function App() {
  const { user, profile, profileError, updateDisplayName } = useAuth();
  const [route, setRoute] = useState('core');
  const [reactorState, dispatchReactor] = useReducer(reactorReducer, 'idle');
  const [preferences, setPreferences] = useState(readPreferences);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [preferencesOwnerId, setPreferencesOwnerId] = useState(null);
  const [preferenceStatus, setPreferenceStatus] = useState('loading');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversationCursor, setConversationCursor] = useState(null);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [messagesCursor, setMessagesCursor] = useState(null);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [failedMessageId, setFailedMessageId] = useState(null);
  const [events, setEvents] = useState(() => [createEvent('SYSTEM', 'Interface local inicializada.', 'SUCCESS')]);
  const [processing, setProcessing] = useState(false);
  const [moduleDetail, setModuleDetail] = useState(null);
  const [notice, setNotice] = useState('');
  const [sessionId] = useState(() => `JRV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  const previousReactorState = useRef('idle');
  const processingRef = useRef(false);
  const creatingConversationRef = useRef(false);
  const timersRef = useRef([]);
  const requestControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const historyRequestIdRef = useRef(0);
  const activeConversationRef = useRef(null);
  const messagesRef = useRef([]);
  const inFlightMessageRef = useRef(null);
  const pendingDraftRef = useRef(new Map());
  const noticeTimerRef = useRef(null);
  const skipNextPreferenceSave = useRef(false);
  const preferenceLoadFailed = useRef(false);

  const logEvent = useCallback((category, description, level = 'INFO') => {
    setEvents((current) => [createEvent(category, description, level), ...current].slice(0, 40));
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (previousReactorState.current !== reactorState) {
      logEvent('REACTOR', `Estado alterado: ${previousReactorState.current.toUpperCase()} → ${reactorState.toUpperCase()}.`);
      previousReactorState.current = reactorState;
    }
  }, [logEvent, reactorState]);

  useEffect(() => {
    if (!user) {
      setPreferencesReady(false);
      setPreferencesOwnerId(null);
      setPreferenceStatus('local');
      return undefined;
    }

    let active = true;
    preferenceLoadFailed.current = false;
    setPreferencesReady(false);
    setPreferenceStatus('loading');
    loadPreferences(user.id).then((loadedPreferences) => {
      if (!active) return;
      skipNextPreferenceSave.current = true;
      setPreferences(loadedPreferences);
      setPreferencesReady(true);
      setPreferencesOwnerId(user.id);
      setPreferenceStatus('saved');
    }).catch(() => {
      if (!active) return;
      preferenceLoadFailed.current = true;
      setPreferenceStatus('error');
      setNotice('Não foi possível carregar suas preferências. Atualize a página para tentar novamente.');
      logEvent('PREFERENCE', 'Falha ao carregar preferências da conta.', 'ERROR');
    });

    return () => { active = false; };
  }, [logEvent, user?.id]);

  useEffect(() => {
    if (!user) {
      try {
        window.localStorage.setItem('jarvis.preferences', JSON.stringify(preferences));
      } catch (error) {
        console.error('Não foi possível salvar as preferências locais do Jarvis.', error);
        dispatchReactor('error');
        logEvent('PREFERENCE', 'Falha ao salvar as preferências locais.', 'ERROR');
        setPreferenceStatus('error');
        setNotice('Não foi possível salvar as preferências neste navegador.');
      }
      return undefined;
    }
    if (!preferencesReady || preferencesOwnerId !== user.id || preferenceLoadFailed.current) return undefined;
    if (skipNextPreferenceSave.current) {
      skipNextPreferenceSave.current = false;
      return undefined;
    }

    setPreferenceStatus('saving');
    const timer = window.setTimeout(() => {
      savePreferences(user.id, preferences).then(() => {
        setPreferenceStatus('saved');
      }).catch(() => {
        setPreferenceStatus('error');
        setNotice('Não foi possível salvar suas preferências. Verifique a conexão e atualize para tentar novamente.');
        logEvent('PREFERENCE', 'Falha ao salvar preferências da conta.', 'ERROR');
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [logEvent, preferences, preferencesOwnerId, preferencesReady, user]);

  useEffect(() => {
    if (profileError) setNotice(profileError);
  }, [profileError]);

  useEffect(() => () => {
    requestIdRef.current += 1;
    requestControllerRef.current?.abort();
    timersRef.current.forEach(window.clearTimeout);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!moduleDetail) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setModuleDetail(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [moduleDetail]);

  const changeRoute = useCallback((nextRoute) => {
    if (!NAV_ITEMS.some((item) => item.id === nextRoute)) return;
    setRoute(nextRoute);
    logEvent('NAVIGATION', `Visualização alterada para ${NAV_ITEMS.find((item) => item.id === nextRoute).label}.`);
  }, [logEvent]);

  const updatePreference = useCallback((key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    logEvent('PREFERENCE', `Preferência visual alterada: ${key}.`);
  }, [logEvent]);

  const showNotice = useCallback((text) => {
    setNotice(text);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(''), 3500);
  }, []);

  const handleSignOut = useCallback(async () => {
    requestIdRef.current += 1;
    requestControllerRef.current?.abort();
    try {
      await signOut();
    } catch {
      showNotice('Não foi possível encerrar a sessão. Tente novamente.');
    }
  }, [showNotice]);

  const handleProfileSave = useCallback(async (displayName) => {
    if (displayName.trim().length < 2 || displayName.trim().length > 80) {
      throw new Error('O nome deve ter entre 2 e 80 caracteres.');
    }
    return updateDisplayName(displayName);
  }, [updateDisplayName]);

  useEffect(() => {
    if (!user) {
      activeConversationRef.current = null;
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      messagesRef.current = [];
      setConversationCursor(null);
      setHasMoreConversations(false);
      setConversationsLoading(false);
      setFailedMessageId(null);
      setProcessing(false);
      processingRef.current = false;
      inFlightMessageRef.current = null;
      pendingDraftRef.current.clear();
      return undefined;
    }

    let active = true;
    setConversationsLoading(true);
    setMessages([]);
    messagesRef.current = [];
    setConversations([]);
    setActiveConversationId(null);
    activeConversationRef.current = null;
    listConversations().then((page) => {
      if (!active) return;
      setConversations(page.conversations);
      setConversationCursor(page.nextCursor);
      setHasMoreConversations(page.hasMore);
      const firstConversation = page.conversations[0] || null;
      activeConversationRef.current = firstConversation?.id || null;
      setActiveConversationId(firstConversation?.id || null);
    }).catch(() => {
      if (active) showNotice('Não foi possível carregar suas conversas. Verifique a conexão e tente novamente.');
    }).finally(() => {
      if (active) setConversationsLoading(false);
    });
    return () => { active = false; };
  }, [showNotice, user?.id]);

  useEffect(() => {
    if (!activeConversationId || activeConversationRef.current !== activeConversationId) {
      setMessages([]);
      setMessagesCursor(null);
      setHasOlderMessages(false);
      setMessagesLoading(false);
      setFailedMessageId(null);
      return undefined;
    }

    let active = true;
    const requestId = ++historyRequestIdRef.current;
    setMessages([]);
    messagesRef.current = [];
    setMessagesLoading(true);
    setFailedMessageId(null);
    listMessages(activeConversationId).then((page) => {
      if (!active || requestId !== historyRequestIdRef.current) return;
      setMessages(page.messages);
      messagesRef.current = page.messages;
      setMessagesCursor(page.nextCursor);
      setHasOlderMessages(page.hasMore);
      if (page.messages.at(-1)?.role === 'user') {
        setFailedMessageId(page.messages.at(-1).id);
      }
    }).catch(() => {
      if (active) showNotice('Não foi possível carregar as mensagens desta conversa.');
    }).finally(() => {
      if (active) setMessagesLoading(false);
    });
    return () => { active = false; };
  }, [activeConversationId, showNotice]);

  const cancelPendingRequest = useCallback(() => {
    requestIdRef.current += 1;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
    processingRef.current = false;
    inFlightMessageRef.current = null;
    setProcessing(false);
    dispatchReactor('idle');
  }, []);

  const selectConversation = useCallback((conversationId) => {
    if (conversationId === activeConversationRef.current) return;
    if (processingRef.current) {
      setFailedMessageId(inFlightMessageRef.current);
      cancelPendingRequest();
    }
    activeConversationRef.current = conversationId;
    messagesRef.current = [];
    setMessages([]);
    setActiveConversationId(conversationId);
  }, [cancelPendingRequest]);

  const handleNewConversation = useCallback(async () => {
    if (creatingConversationRef.current) return;
    if (processingRef.current) {
      setFailedMessageId(inFlightMessageRef.current);
      cancelPendingRequest();
    }
    creatingConversationRef.current = true;
    try {
      const conversation = await createConversation();
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
      activeConversationRef.current = conversation.id;
      messagesRef.current = [];
      setActiveConversationId(conversation.id);
      setMessages([]);
      setFailedMessageId(null);
    } catch {
      showNotice('Não foi possível criar uma conversa. Tente novamente.');
    } finally {
      creatingConversationRef.current = false;
    }
  }, [cancelPendingRequest, showNotice]);

  const loadMoreConversations = useCallback(async () => {
    if (!conversationCursor || conversationsLoading) return;
    setConversationsLoading(true);
    try {
      const page = await listConversations({ cursor: conversationCursor });
      setConversations((current) => [...current, ...page.conversations]);
      setConversationCursor(page.nextCursor);
      setHasMoreConversations(page.hasMore);
    } catch {
      showNotice('Não foi possível carregar mais conversas.');
    } finally {
      setConversationsLoading(false);
    }
  }, [conversationCursor, conversationsLoading, showNotice]);

  const loadOlderMessages = useCallback(async () => {
    const conversationId = activeConversationRef.current;
    if (!conversationId || !messagesCursor || historyLoading) return;
    setHistoryLoading(true);
    try {
      const page = await listMessages(conversationId, { before: messagesCursor });
      if (activeConversationRef.current !== conversationId) return;
      const combined = [...page.messages, ...messagesRef.current];
      messagesRef.current = combined;
      setMessages(combined);
      setMessagesCursor(page.nextCursor);
      setHasOlderMessages(page.hasMore);
    } catch {
      showNotice('Não foi possível carregar mensagens anteriores.');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLoading, messagesCursor, showNotice]);

  const sendCommand = useCallback(async (rawCommand, retryMessageId = null) => {
    const command = rawCommand.trim();
    if (!command || processingRef.current) return;
    if (command.length > MAX_MESSAGE_LENGTH) {
      showNotice(`A mensagem pode ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`);
      return;
    }
    const lastMessage = messagesRef.current.at(-1);
    if (!retryMessageId && lastMessage?.role === 'user') return;
    if (retryMessageId && lastMessage?.id !== retryMessageId) return;

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    requestControllerRef.current = controller;
    processingRef.current = true;
    setProcessing(true);
    dispatchReactor('thinking');
    logEvent('COMMAND', 'Mensagem enviada ao Jarvis.');

    let conversationId = activeConversationRef.current;
    let messageId = retryMessageId;
    inFlightMessageRef.current = retryMessageId;

    try {
      if (!conversationId) {
        const conversation = await createConversation();
        if (requestId !== requestIdRef.current) {
          setConversations((current) => [conversation, ...current]);
          return;
        }
        conversationId = conversation.id;
        activeConversationRef.current = conversation.id;
        messagesRef.current = [];
        setMessages([]);
        setActiveConversationId(conversation.id);
        setConversations((current) => [conversation, ...current]);
      }

      if (!messageId) {
        let pendingDraft = pendingDraftRef.current.get(conversationId);
        if (pendingDraft) {
          if (
            pendingDraft.content !== command
          ) {
            showNotice('Reenvie a mesma mensagem para confirmar se ela foi salva antes de enviar outra.');
            processingRef.current = false;
            requestControllerRef.current = null;
            setProcessing(false);
            dispatchReactor('idle');
            return;
          }
        } else {
          pendingDraft = {
            content: command,
            clientMessageId: crypto.randomUUID(),
          };
          pendingDraftRef.current.set(conversationId, pendingDraft);
        }
        const savedMessage = await addUserMessage(
          conversationId,
          command,
          pendingDraft.clientMessageId,
        );
        messageId = savedMessage.id;
        pendingDraftRef.current.delete(conversationId);
        inFlightMessageRef.current = messageId;
        if (activeConversationRef.current === conversationId) {
          messagesRef.current = [...messagesRef.current, savedMessage];
          setMessages(messagesRef.current);
        }
        if (requestId !== requestIdRef.current) {
          if (activeConversationRef.current === conversationId) setFailedMessageId(messageId);
          return;
        }
      }

      const conversation = await touchConversation(conversationId, command);
      if (requestId !== requestIdRef.current) return;
      setConversations((current) => [
        conversation,
        ...current.filter((item) => item.id !== conversation.id),
      ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setFailedMessageId(null);
      const reply = await sendAssistantMessage({ conversationId, messageId }, { signal: controller.signal });
      if (requestId !== requestIdRef.current) return;

      if (activeConversationRef.current === conversationId) {
        setMessages((current) => current.some((item) => item.id === reply.id)
          ? current
          : [...current, reply]);
        messagesRef.current = [...messagesRef.current.filter((item) => item.id !== reply.id), reply];
        setFailedMessageId(null);
      }
      const result = getCommandResult(command);
      if (result?.route) changeRoute(result.route);
      setConversations((current) => current
        .map((item) => item.id === conversationId
          ? { ...item, updatedAt: reply.time.toISOString() }
          : item)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      dispatchReactor('speaking');
      const successTimer = window.setTimeout(() => {
        if (requestId !== requestIdRef.current) return;
        dispatchReactor('success');
        const idleTimer = window.setTimeout(() => {
          if (requestId !== requestIdRef.current) return;
          dispatchReactor('idle');
          processingRef.current = false;
          inFlightMessageRef.current = null;
          requestControllerRef.current = null;
          setProcessing(false);
        }, 700);
        timersRef.current.push(idleTimer);
      }, 300);
      timersRef.current.push(successTimer);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      if (messageId && activeConversationRef.current === conversationId) setFailedMessageId(messageId);
      if (controller.signal.aborted) {
        showNotice('Interação interrompida. A mensagem foi salva e pode ser reenviada.');
      } else {
        const message = error instanceof Error ? error.message : 'Não foi possível obter uma resposta agora.';
        showNotice(message);
        logEvent('ASSISTANT', 'Falha ao obter ou salvar a resposta do assistente.', 'ERROR');
        dispatchReactor('error');
      }
      processingRef.current = false;
      inFlightMessageRef.current = null;
      requestControllerRef.current = null;
      setProcessing(false);
    }
  }, [changeRoute, logEvent, showNotice]);

  const retryMessage = useCallback((messageId) => {
    const message = messagesRef.current.find((item) => item.id === messageId);
    if (message?.role === 'user') void sendCommand(message.text, message.id);
  }, [sendCommand]);

  const toggleListening = useCallback(() => {
    if (processingRef.current) return;
    if (reactorState === 'listening') {
      dispatchReactor('idle');
      logEvent('REACTOR', 'Demonstração de escuta encerrada.');
    } else if (reactorState === 'idle' || reactorState === 'success' || reactorState === 'error') {
      dispatchReactor('listening');
      logEvent('REACTOR', 'Demonstração de escuta iniciada; nenhum áudio é capturado.');
    }
  }, [logEvent, reactorState]);

  const interrupt = useCallback(() => {
    setFailedMessageId(inFlightMessageRef.current);
    cancelPendingRequest();
    logEvent('REACTOR', 'Interação local interrompida.', 'WARNING');
    showNotice('Interação interrompida. A mensagem pode ser reenviada.');
  }, [cancelPendingRequest, logEvent, showNotice]);

  const theme = useMemo(() => ACCENTS[preferences.accent], [preferences.accent]);
  const style = {
    '--accent-primary': theme.primary,
    '--accent-secondary': theme.secondary,
    '--accent-rgb': theme.rgb,
    '--effect-opacity': preferences.intensity / 100,
  };
  const activeModule = MODULES.find((module) => module.id === moduleDetail);

  return (
    <div className={`app-shell density-${preferences.density}${preferences.reducedMotion ? ' reduced-motion' : ''}${preferences.particles ? '' : ' no-particles'}`} style={style}>
      <div className="ambient-grid" aria-hidden="true" />
      <Hud
        sessionId={sessionId}
        onSettings={() => changeRoute('settings')}
        accent={preferences.accent}
        onAccent={() => {
          const order = Object.keys(ACCENTS);
          const next = order[(order.indexOf(preferences.accent) + 1) % order.length];
          updatePreference('accent', next);
        }}
        reactorState={reactorState}
        profile={profile}
        email={user.email}
        onSignOut={handleSignOut}
      />
      <div className="workspace">
        <Navigation active={route} onNavigate={changeRoute} />
        <main className="main-view" id="main-content">
          {route === 'core' && (
            <CoreView
              reactorState={reactorState}
              onToggleListening={toggleListening}
              messages={messages}
              onSend={sendCommand}
              processing={processing}
              onInterrupt={interrupt}
              onNewConversation={handleNewConversation}
              conversations={conversations}
              activeConversationId={activeConversationId}
              conversationsLoading={conversationsLoading}
              hasMoreConversations={hasMoreConversations}
              onLoadMoreConversations={loadMoreConversations}
              onSelectConversation={selectConversation}
              messagesLoading={messagesLoading}
              historyLoading={historyLoading}
              hasOlderMessages={hasOlderMessages}
              onLoadOlderMessages={loadOlderMessages}
              failedMessageId={failedMessageId}
              onRetry={retryMessage}
              onNavigate={changeRoute}
            />
          )}
          {route === 'brain' && <BrainView />}
          {route === 'log' && <LogView events={events} />}
          {route === 'modules' && <ModulesView onOpenModule={setModuleDetail} onNavigate={changeRoute} />}
          {route === 'settings' && <SettingsView preferences={preferences} onChange={updatePreference} persistenceStatus={preferenceStatus} profile={profile} onSaveProfile={handleProfileSave} />}
        </main>
      </div>
      <footer className="system-footer">
        <span><span className="footer-dot" /> CONTA AUTENTICADA</span>
        <span>PREFERÊNCIAS INDIVIDUAIS</span>
        <span>BUILD 01.01 · {sessionId}</span>
      </footer>
      {notice && <div className="toast" role="status"><Icon name="info" size={15} />{notice}</div>}
      {activeModule && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModuleDetail(null);
        }}>
          <section className="module-modal" role="dialog" aria-modal="true" aria-labelledby="module-modal-title">
            <button className="icon-button modal-close" onClick={() => setModuleDetail(null)} aria-label="Fechar detalhes"><Icon name="close" /></button>
            <span className="eyebrow">MÓDULO · {activeModule.status}</span>
            <div className="modal-icon"><Icon name={activeModule.icon} size={22} /></div>
            <h2 id="module-modal-title">{activeModule.name}</h2>
            <p>{activeModule.detail}</p>
            <button className="button-secondary" onClick={() => {
              if (activeModule.id === 'brain') changeRoute('brain');
              setModuleDetail(null);
            }}>{activeModule.id === 'brain' ? 'EXPLORAR MAPA' : 'ENTENDI'} <Icon name="arrow" size={14} /></button>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
