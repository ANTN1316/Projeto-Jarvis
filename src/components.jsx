import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MODULES, NAV_ITEMS } from './data.js';
import {
  createBrainMemory,
  deleteBrainMemory,
  listBrainMemories,
  updateBrainMemory,
} from './services/brain.js';

const iconPaths = {
  core: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>,
  brain: <><path d="M9 4a3 3 0 0 0-5 2.2A3.4 3.4 0 0 0 3 12a3.5 3.5 0 0 0 2 5.8A3 3 0 0 0 10 20V4Zm6 0a3 3 0 0 1 5 2.2A3.4 3.4 0 0 1 21 12a3.5 3.5 0 0 1-2 5.8A3 3 0 0 1 14 20V4Z" /><path d="M7 9h3m4 0h3M8 15h2m4 0h2" /></>,
  log: <><path d="M4 5h16M4 12h16M4 19h16" /><circle cx="2.5" cy="5" r=".5" /><circle cx="2.5" cy="12" r=".5" /><circle cx="2.5" cy="19" r=".5" /></>,
  modules: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="5" rx="1" /><rect x="13" y="10" width="8" height="11" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 1 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 1 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" /></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0m-7 7v5m-4 0h8" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  radar: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="m12 12 6-6M12 3v2m9 7h-2" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  wifi: <><path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0M11 18.5a2 2 0 0 1 2 0" /><path d="m3 3 18 18" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  stop: <><rect x="5" y="5" width="14" height="14" rx="3" /></>,
  trash: <><path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <><path d="M5 12h14" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
};

export function Icon({ name, size = 18, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name] || iconPaths.info}
    </svg>
  );
}

export function Hud({ sessionId, onSettings, accent, onAccent, reactorState, profile, email, onSignOut }) {
  const [now, setNow] = useState(new Date());
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="hud">
      <a className="brand" href="#main-content" aria-label="J.A.R.V.I.S. — ir ao conteúdo principal">
        <span className="brand-mark"><span /><i /><b /></span>
        <span className="brand-copy"><strong>J.A.R.V.I.S.</strong><small>NEURAL INTERFACE</small></span>
        <span className="brand-live"><i /> AUTH</span>
      </a>
      <div className="hud-center">
        <div className="clock-block"><strong>{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong><span>{now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
        <span className="hud-divider" />
        <span className="connection-label"><Icon name="wifi" size={16} /><span><b>REDE</b><small>NÃO VERIFICADA</small></span></span>
        <span className="session-label">{sessionId}</span>
      </div>
      <div className="hud-actions">
        <button className="icon-button theme-control" onClick={onAccent} aria-label={`Alternar cor de destaque. Tema atual: ${accent}`} title="Alternar cor de destaque"><span className="theme-dot" /></button>
        <button className="icon-button" onClick={onSettings} aria-label="Abrir configurações" title="Configurações"><Icon name="settings" /></button>
        <span className={`mic-indicator ${reactorState === 'listening' ? 'is-listening' : ''}`} title="Microfone não conectado"><Icon name="mic" size={17} /><i /></span>
        <div className="profile-wrap">
          <button className="profile-button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label={`Conta de ${profile?.display_name || email || 'usuário'}`}>
            <span className="avatar"><Icon name="user" size={17} /></span><span className="profile-copy">{profile?.display_name || 'USUÁRIO'}<span>CONTA</span></span>
          </button>
          {profileOpen && <div className="profile-popover"><b>{profile?.display_name || 'Conta Jarvis'}</b><span>{email}</span><button onClick={() => { setProfileOpen(false); onSignOut(); }}>ENCERRAR SESSÃO <Icon name="arrow" size={13} /></button></div>}
        </div>
      </div>
    </header>
  );
}

export function Navigation({ active, onNavigate }) {
  return (
    <nav className="navigation" aria-label="Navegação principal">
      <span className="nav-caption">ESPAÇO DE TRABALHO</span>
      {NAV_ITEMS.map((item, index) => (
        <button key={item.id} className={`nav-item${active === item.id ? ' active' : ''}`} onClick={() => onNavigate(item.id)} aria-current={active === item.id ? 'page' : undefined}>
          <Icon name={item.icon} size={18} /><span>{item.label}</span><kbd>{index === 0 ? '01' : `0${index + 1}`}</kbd>
        </button>
      ))}
      <div className="nav-bottom"><span className="nav-caption">AMBIENTE</span><div className="local-status"><span className="status-pulse" /><div><b>Modo local</b><small>Serviços desconectados</small></div></div><small className="nav-version">NEURAL SYSTEM · 1.0</small></div>
    </nav>
  );
}

function PageHeading({ eyebrow, title, subtitle, aside }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{aside && <div className="heading-aside">{aside}</div>}</div>;
}

function Reactor({ state, onActivate }) {
  const rings = Array.from({ length: 48 }, (_, index) => {
    const angle = (index * 7.5 * Math.PI) / 180;
    const inner = index % 4 === 0 ? 151 : 157;
    const outer = index % 4 === 0 ? 173 : 165;
    return <line key={index} x1={200 + Math.cos(angle) * inner} y1={200 + Math.sin(angle) * inner} x2={200 + Math.cos(angle) * outer} y2={200 + Math.sin(angle) * outer} className={index % 4 === 0 ? 'reactor-tick major' : 'reactor-tick'} />;
  });
  return (
    <button className={`reactor reactor-${state}`} onClick={onActivate} aria-label={state === 'listening' ? 'Encerrar demonstração de escuta' : 'Iniciar demonstração de escuta'} aria-pressed={state === 'listening'}>
      <svg viewBox="0 0 400 400" role="img" aria-labelledby="reactor-title reactor-description">
        <title id="reactor-title">Reator neural Jarvis</title><desc id="reactor-description">Visualização técnica animada do estado {state}.</desc>
        <defs>
          <radialGradient id="core-gradient"><stop offset="0" stopColor="var(--accent-primary)" stopOpacity=".56" /><stop offset=".34" stopColor="var(--accent-primary)" stopOpacity=".16" /><stop offset="1" stopColor="var(--accent-primary)" stopOpacity="0" /></radialGradient>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--accent-primary)" /><stop offset=".52" stopColor="var(--accent-secondary)" stopOpacity=".22" /><stop offset="1" stopColor="var(--accent-primary)" /></linearGradient>
          <filter id="core-glow"><feGaussianBlur stdDeviation="8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx="200" cy="200" r="190" fill="url(#core-gradient)" className="reactor-halo" />
        <circle cx="200" cy="200" r="182" className="reactor-orbit orbit-one" />
        <circle cx="200" cy="200" r="174" className="reactor-orbit orbit-two" />
        <g>{rings}</g>
        <circle cx="200" cy="200" r="145" className="reactor-ring ring-main" />
        <circle cx="200" cy="200" r="129" className="reactor-ring ring-counter" />
        <circle cx="200" cy="200" r="111" className="reactor-ring ring-inner" />
        <path d="M200 55 A145 145 0 0 1 327 130" className="reactor-arc arc-one" />
        <path d="M200 345 A145 145 0 0 1 73 270" className="reactor-arc arc-two" />
        <path d="M92 135 A128 128 0 0 1 200 72" className="reactor-arc arc-three" />
        <path d="M300 286 A128 128 0 0 1 200 328" className="reactor-arc arc-four" />
        <circle cx="200" cy="200" r="91" className="reactor-core-disc" />
        <circle cx="200" cy="200" r="78" className="reactor-core-fill" fill="url(#core-gradient)" />
        <circle cx="200" cy="200" r="59" className="reactor-inner-orbit" />
        <g className="reactor-center" filter="url(#core-glow)">
          <path d="M200 157 236 178v44l-36 21-36-21v-44z" />
          <path d="m200 171 24 14v29l-24 14-24-14v-29z" />
          <circle cx="200" cy="200" r="13" />
          <path d="M200 180v-10m0 60v-10m20-20h10m-60 0h10" />
        </g>
        <g className="orbit-points"><circle cx="200" cy="54" r="4" /><circle cx="328" cy="275" r="3" /><circle cx="83" cy="135" r="3" /></g>
        <circle cx="200" cy="200" r="51" className="listening-wave wave-one" /><circle cx="200" cy="200" r="51" className="listening-wave wave-two" />
      </svg>
      <span className="reactor-center-label">{state === 'idle' ? 'J' : state === 'listening' ? <Icon name="mic" size={19} /> : state === 'thinking' ? <Icon name="spark" size={19} /> : state === 'speaking' ? '···' : state === 'success' ? <Icon name="check" size={20} /> : '!'}</span>
      <span className="reactor-sr">Ativar escuta de demonstração</span>
    </button>
  );
}

function StateLabel({ state }) {
  const labels = { idle: 'SISTEMA EM ESPERA', listening: 'ESCUTA SIMULADA', thinking: 'PROCESSANDO', speaking: 'RESPONDENDO', success: 'AÇÃO CONCLUÍDA', error: 'ERRO' };
  return <span className={`state-label state-${state}`}><i />{labels[state]}</span>;
}

function Metric({ label, value, detail }) {
  return <div className="metric-row"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>;
}

export function CoreView({
  reactorState,
  onToggleListening,
  messages,
  onSend,
  processing,
  onInterrupt,
  onNewConversation,
  conversations,
  activeConversationId,
  conversationsLoading,
  hasMoreConversations,
  onLoadMoreConversations,
  onSelectConversation,
  messagesLoading,
  historyLoading,
  hasOlderMessages,
  onLoadOlderMessages,
  failedMessageId,
  onRetry,
  onNavigate,
}) {
  return (
    <div className="view-content core-view">
      <PageHeading eyebrow="J.A.R.V.I.S. / CENTRAL DE COMANDO" title="Núcleo de inteligência" subtitle="Converse com o assistente e explore a interface Jarvis." aside={<StateLabel state={reactorState} />} />
      <div className="core-layout">
        <aside className="side-column left-column">
          <section className="panel status-panel">
            <div className="panel-heading"><span className="panel-index">01</span><div><h2>Diagnóstico</h2><small>ESTADO DA INTERFACE</small></div><span className="tiny-live">ONLINE</span></div>
            <div className="diagnostic-graphic"><div className="diagnostic-crosshair"><span /><i /></div><div className="diagnostic-readout"><small>CORE LOAD</small><strong>—<em>%</em></strong><span>NÃO MEDIDO</span></div></div>
            <Metric label="Interface" value="ATIVA" />
            <Metric label="Rede externa" value="NÃO VERIFICADA" />
            <Metric label="Serviços" value="IA SOB DEMANDA" />
            <div className="panel-footnote"><Icon name="info" size={13} /> Mensagens livres usam a Edge Function autenticada.</div>
          </section>
          <section className="panel quick-panel">
            <div className="panel-heading"><span className="panel-index">02</span><div><h2>Atalhos</h2><small>COMANDOS DE NAVEGAÇÃO</small></div></div>
            <button className="quick-link" onClick={() => onNavigate('brain')}><Icon name="brain" /><span>Explorar memória<small>Second Brain · notas pessoais</small></span><Icon name="arrow" size={15} /></button>
            <button className="quick-link" onClick={() => onNavigate('modules')}><Icon name="modules" /><span>Ver módulos<small>Estados e disponibilidade</small></span><Icon name="arrow" size={15} /></button>
          </section>
        </aside>
        <section className="center-column" aria-label="Interação com o núcleo">
              <div className="reactor-stage"><div className="stage-topline"><span>NEURAL CORE <i>·</i> V.01</span><span>INTERFACE JARVIS</span></div><Reactor state={reactorState} onActivate={onToggleListening} /><div className="reactor-state-copy"><StateLabel state={reactorState} /><p>{reactorState === 'listening' ? 'Demonstração ativa · áudio não capturado' : reactorState === 'thinking' ? 'Processando mensagem...' : reactorState === 'speaking' ? 'Resposta do assistente recebida' : reactorState === 'success' ? 'Interação finalizada' : 'Toque no núcleo para iniciar uma escuta simulada'}</p></div><div className="stage-bottomline"><span>LATÊNCIA <b>—</b></span><span><i className="mini-dot" /> ASSISTENTE</span><span>EDGE FUNCTION</span></div></div>
          <CommandConsole
            messages={messages}
            onSend={onSend}
            processing={processing}
            onInterrupt={onInterrupt}
            onNewConversation={onNewConversation}
            conversations={conversations}
            activeConversationId={activeConversationId}
            conversationsLoading={conversationsLoading}
            hasMoreConversations={hasMoreConversations}
            onLoadMoreConversations={onLoadMoreConversations}
            onSelectConversation={onSelectConversation}
            messagesLoading={messagesLoading}
            historyLoading={historyLoading}
            hasOlderMessages={hasOlderMessages}
            onLoadOlderMessages={onLoadOlderMessages}
            failedMessageId={failedMessageId}
            onRetry={onRetry}
            onToggleListening={onToggleListening}
            reactorState={reactorState}
          />
        </section>
        <aside className="side-column right-column">
          <section className="panel telemetry-panel">
            <div className="panel-heading"><span className="panel-index">03</span><div><h2>Telemetria</h2><small>SINAIS DA INTERFACE</small></div></div>
            <div className="telemetry-display"><div className="telemetry-label"><span>SESSION ACTIVITY</span><span>LOCAL</span></div><div className="signal-bars" aria-label="Sinal visual decorativo">{[18, 30, 23, 44, 34, 56, 40, 28, 49, 36, 61, 42, 26, 51, 34, 46, 28, 55, 38, 24, 42, 31, 49, 35].map((height, index) => <i key={index} style={{ '--bar-height': `${height}px` }} />)}</div><div className="telemetry-axis"><span>VISUALIZAÇÃO DECORATIVA</span><span>SEM DADOS REAIS</span></div></div>
            <Metric label="Memória visual" value="10 NÓS" detail="conteúdo fictício" />
            <Metric label="Histórico local" value="ATIVO" detail="limite de 40 eventos" />
            <div className="availability"><span className="availability-icon"><Icon name="wifi" size={16} /></span><span><b>Conectividade</b><small>Não verificada</small></span><span className="tag-muted">LOCAL</span></div>
          </section>
          <section className="panel module-preview">
            <div className="panel-heading"><span className="panel-index">04</span><div><h2>Capacidades</h2><small>MÓDULOS DO SISTEMA</small></div><button className="text-action" onClick={() => onNavigate('modules')}>VER TODOS</button></div>
            <div className="capability"><span className="capability-icon"><Icon name="brain" size={16} /></span><span><b>Second Brain</b><small>Visualização local</small></span><span className="tag-demo">DEMO</span></div>
            <div className="capability"><span className="capability-icon dim"><Icon name="mic" size={16} /></span><span><b>Voice Interface</b><small>Sem captura de áudio</small></span><span className="tag-muted">PLANNED</span></div>
            <div className="panel-footnote"><span className="status-pulse" /> Nenhum serviço externo conectado.</div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function CommandConsole({
  messages,
  onSend,
  processing,
  onInterrupt,
  onNewConversation,
  conversations,
  activeConversationId,
  conversationsLoading,
  hasMoreConversations,
  onLoadMoreConversations,
  onSelectConversation,
  messagesLoading,
  historyLoading,
  hasOlderMessages,
  onLoadOlderMessages,
  failedMessageId,
  onRetry,
  onToggleListening,
  reactorState,
}) {
  const [draft, setDraft] = useState('');
  const messageListRef = useRef(null);
  const preserveScrollHeightRef = useRef(null);
  const awaitingReply = messages.at(-1)?.role === 'user';
  useLayoutEffect(() => {
    if (!messageListRef.current) return;
    if (preserveScrollHeightRef.current !== null) {
      messageListRef.current.scrollTop += messageListRef.current.scrollHeight - preserveScrollHeightRef.current;
      preserveScrollHeightRef.current = null;
      return;
    }
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, processing]);
  const loadOlder = () => {
    preserveScrollHeightRef.current = messageListRef.current?.scrollHeight ?? null;
    onLoadOlderMessages();
  };
  const submit = (event) => {
    event.preventDefault();
    if (!draft.trim() || draft.trim().length > 4000 || processing) return;
    onSend(draft);
    setDraft('');
  };
  return (
    <section className="panel command-console">
      <div className="console-header"><div className="console-assistant"><span className="assistant-glyph"><Icon name="spark" size={16} /></span><span><b>J.A.R.V.I.S.</b><small>CONVERSAS PRIVADAS · SALVAS NA CONTA</small></span></div><div className="console-actions"><span className="console-status"><i /> {processing ? 'PROCESSANDO' : 'PRONTO'}</span><button className="button-secondary new-conversation-button" onClick={onNewConversation}><Icon name="plus" size={14} /> NOVA</button></div></div>
      <div className="conversation-strip" aria-label="Suas conversas">
        {conversationsLoading && !conversations.length && <span className="conversation-loading">Carregando conversas…</span>}
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            className={`conversation-tab${activeConversationId === conversation.id ? ' active' : ''}`}
            onClick={() => onSelectConversation(conversation.id)}
            aria-current={activeConversationId === conversation.id ? 'page' : undefined}
            title={conversation.title}
          >{conversation.title}</button>
        ))}
        {hasMoreConversations && <button className="conversation-more" onClick={onLoadMoreConversations} disabled={conversationsLoading}>MAIS</button>}
        {!conversations.length && !conversationsLoading && <span className="conversation-loading">Nenhuma conversa salva.</span>}
      </div>
      <div className="message-list" ref={messageListRef} aria-live="polite" aria-label="Histórico de conversa">
        {hasOlderMessages && <button className="history-more" onClick={loadOlder} disabled={historyLoading}>{historyLoading ? 'CARREGANDO…' : 'CARREGAR MENSAGENS ANTERIORES'}</button>}
        {messagesLoading && !messages.length && <div className="empty-conversation">Carregando histórico…</div>}
        {messages.map((message) => <div className={`message message-${message.role}`} key={message.id}><span className="message-avatar">{message.role === 'user' ? 'U' : <Icon name="spark" size={13} />}</span><div className="message-body"><div><b>{message.role === 'user' ? 'VOCÊ' : 'J.A.R.V.I.S.'}</b><time>{message.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time></div><p>{message.text}</p></div></div>)}
        {processing && <div className="message message-assistant typing-message"><span className="message-avatar"><Icon name="spark" size={13} /></span><span className="typing-dots" aria-label="Processando"><i /><i /><i /></span></div>}
        {!messages.length && !messagesLoading && !activeConversationId && <div className="empty-conversation"><Icon name="spark" size={17} /> Crie uma conversa para começar.</div>}
        {!messages.length && !messagesLoading && activeConversationId && <div className="empty-conversation"><Icon name="spark" size={17} /> Esta conversa está pronta para sua primeira mensagem.</div>}
        {failedMessageId && <div className="retry-row"><span>Esta mensagem ainda não recebeu resposta.</span><button onClick={() => onRetry(failedMessageId)} disabled={processing}>TENTAR NOVAMENTE</button></div>}
      </div>
      <div className="command-suggestions"><span>EXPERIMENTE</span>{['Olá, Jarvis.', 'Status do sistema.', 'Abrir Second Brain.'].map((suggestion) => <button key={suggestion} onClick={() => { setDraft(suggestion); }} disabled={processing}>{suggestion}</button>)}</div>
      <form className="command-form" onSubmit={submit}>
        <label htmlFor="command-input" className="sr-only">Digite uma mensagem para o Jarvis</label>
        <textarea id="command-input" rows="1" maxLength={4000} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(event); } }} placeholder={awaitingReply ? 'Reenvie a mensagem pendente para continuar...' : 'Escreva uma mensagem...'} disabled={processing || messagesLoading || awaitingReply} />
        <span className="input-hint">{draft.length}/4000 · ENTER ENVIA · SHIFT + ENTER QUEBRA LINHA</span>
        <button className={`mic-demo-button${reactorState === 'listening' ? ' active' : ''}`} type="button" onClick={onToggleListening} disabled={processing} aria-pressed={reactorState === 'listening'} aria-label={reactorState === 'listening' ? 'Encerrar escuta simulada; nenhum áudio está sendo capturado' : 'Iniciar escuta simulada; nenhum áudio será capturado'} title="Escuta simulada · áudio não capturado"><Icon name="mic" size={16} /></button>
        <button className="send-button" type="submit" disabled={!draft.trim() || processing || messagesLoading || awaitingReply} aria-label="Enviar mensagem"><Icon name="send" size={17} /></button>
        {processing && <button type="button" className="interrupt-button" onClick={onInterrupt} aria-label="Interromper interação"><Icon name="stop" size={16} /></button>}
      </form>
      <div className="console-disclaimer"><Icon name="info" size={13} /> Mensagens e respostas ficam salvas na sua conta e são enviadas à OpenAI. Evite dados sensíveis.</div>
    </section>
  );
}

export function BrainView({ userId }) {
  const [memories, setMemories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [category, setCategory] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [draft, setDraft] = useState({
    title: '',
    content: '',
    category: 'note',
    provenance: 'user',
    source: '',
  });
  const categories = [
    { id: 'note', label: 'Nota / ideia' },
    { id: 'memory', label: 'Memória pessoal' },
    { id: 'project', label: 'Projeto' },
    { id: 'decision', label: 'Decisão' },
  ];
  const provenanceOptions = [
    { id: 'user', label: 'Informação fornecida por mim' },
    { id: 'document', label: 'Conteúdo de documento' },
    { id: 'ai_confirmed', label: 'Sugestão de IA confirmada por mim' },
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(0);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    listBrainMemories(userId, { query, category, page }).then((result) => {
      if (!active) return;
      setMemories(result.memories);
      setHasMore(result.hasMore);
      setSelectedId((current) => result.memories.some((memory) => memory.id === current)
        ? current
        : result.memories[0]?.id || null);
    }).catch(() => {
      if (!active) return;
      setError('Não foi possível carregar suas memórias. Verifique sua conexão e se a migration do Second Brain já foi aplicada.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [category, page, query, reloadKey, userId]);

  const selected = memories.find((memory) => memory.id === selectedId);
  const openNewMemory = () => {
    setEditingId(null);
    setDraft({ title: '', content: '', category: 'note', provenance: 'user', source: '' });
    setFormError('');
    setEditorOpen(true);
  };
  const openEditor = (memory) => {
    setEditingId(memory.id);
    setDraft({
      title: memory.title,
      content: memory.content,
      category: memory.category,
      provenance: memory.provenance,
      source: memory.source || '',
    });
    setFormError('');
    setEditorOpen(true);
  };
  const saveMemory = async (event) => {
    event.preventDefault();
    setFormError('');
    if (/(?:senha|password|token|api[_ -]?key|secret)\s*[:=]\s*\S+/i.test(`${draft.title}\n${draft.content}\n${draft.source}`)
      || /\b(?:sb_secret_|sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{16,})/i.test(`${draft.title}\n${draft.content}\n${draft.source}`)) {
      setFormError('Não salve senhas, tokens, chaves ou outros segredos nesta memória.');
      return;
    }
    setSaving(true);
    try {
      const memory = editingId
        ? await updateBrainMemory(userId, editingId, draft)
        : await createBrainMemory(userId, draft);
      setSelectedId(memory.id);
      setPage(0);
      setEditorOpen(false);
      setReloadKey((value) => value + 1);
    } catch {
      setFormError('Não foi possível salvar a memória. Confira os limites dos campos e tente novamente.');
    } finally {
      setSaving(false);
    }
  };
  const removeMemory = async () => {
    if (!selected || !window.confirm(`Excluir "${selected.title}"? Ela deixará de aparecer nas buscas e no contexto do Jarvis.`)) return;
    setError('');
    try {
      await deleteBrainMemory(userId, selected.id);
      setSelectedId(null);
      setEditorOpen(false);
      setReloadKey((value) => value + 1);
    } catch {
      setError('Não foi possível excluir esta memória. Tente novamente.');
    }
  };
  const categoryLabel = (value) => categories.find((item) => item.id === value)?.label || value;
  const provenanceLabel = (value) => provenanceOptions.find((item) => item.id === value)?.label || value;

  return (
    <div className="view-content brain-view">
      <PageHeading eyebrow="MEMÓRIA PESSOAL / 02" title="Second Brain" subtitle="Notas privadas da sua conta, pesquisáveis e recuperadas pelo Jarvis quando forem relevantes." aside={<span className="saved-indicator"><Icon name="check" size={14} /> DADOS DA CONTA</span>} />
      <section className="panel brain-manager">
        <div className="panel-heading">
          <span className="panel-index">MEMÓRIAS</span>
          <div><h2>Conhecimento pessoal</h2><small>ISOLADO POR CONTA · SALVAMENTO EXPLÍCITO</small></div>
          <button className="brain-action" type="button" onClick={openNewMemory}><Icon name="plus" size={15} /> NOVA MEMÓRIA</button>
        </div>
        <div className="brain-toolbar">
          <label className="brain-search"><span className="sr-only">Pesquisar memórias</span><Icon name="search" size={15} /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} maxLength={120} placeholder="Pesquisar notas e memórias..." /></label>
          <label className="brain-filter"><span className="sr-only">Filtrar categoria</span><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(0); }}><option value="all">Todas as categorias</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        </div>
        {error && <div className="brain-message brain-error" role="alert"><span>{error}</span><button type="button" onClick={() => setReloadKey((value) => value + 1)}>TENTAR NOVAMENTE</button></div>}
        {editorOpen && <form className="brain-editor" onSubmit={saveMemory}>
          <div className="brain-editor-heading"><div><span className="eyebrow">{editingId ? 'EDIÇÃO' : 'NOVO REGISTRO'}</span><h3>{editingId ? 'Editar memória' : 'Salvar conhecimento'}</h3></div><button className="icon-button small" type="button" onClick={() => setEditorOpen(false)} aria-label="Fechar editor"><Icon name="close" size={15} /></button></div>
          <label htmlFor="brain-title">Título</label>
          <input id="brain-title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} maxLength={160} required />
          <label htmlFor="brain-content">Conteúdo</label>
          <textarea id="brain-content" value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} maxLength={10000} rows={6} required />
          <div className="brain-form-grid">
            <label>Categoria<select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}>{categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label>Origem<select value={draft.provenance} onChange={(event) => setDraft((current) => ({ ...current, provenance: event.target.value }))}>{provenanceOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          </div>
          <label htmlFor="brain-source">Referência de origem <span>(opcional)</span></label>
          <input id="brain-source" value={draft.source} onChange={(event) => setDraft((current) => ({ ...current, source: event.target.value }))} maxLength={120} placeholder="Ex.: nome do documento ou contexto" />
          <p className="brain-privacy-note"><Icon name="info" size={14} /> Não salve senhas, tokens ou chaves. Memórias marcadas como conteúdo de documento são dados não confiáveis, nunca instruções para ações.</p>
          {formError && <div className="brain-message brain-error" role="alert">{formError}</div>}
          <div className="brain-editor-actions"><span>{draft.content.length}/10000</span><button className="button-secondary" type="button" onClick={() => setEditorOpen(false)} disabled={saving}>CANCELAR</button><button className="brain-action" type="submit" disabled={saving}>{saving ? 'SALVANDO…' : 'SALVAR EXPLICITAMENTE'}</button></div>
        </form>}
        <div className="brain-record-layout">
          <div className="brain-record-list" aria-busy={loading}>
            {loading && <div className="brain-empty">Carregando memórias…</div>}
            {!loading && !error && memories.map((memory) => (
              <button key={memory.id} type="button" className={`brain-record${selectedId === memory.id ? ' selected' : ''}`} onClick={() => { setSelectedId(memory.id); setEditorOpen(false); }} aria-pressed={selectedId === memory.id}>
                <span className="brain-record-meta"><span>{categoryLabel(memory.category)}</span><time dateTime={memory.updatedAt}>{new Date(memory.updatedAt).toLocaleDateString('pt-BR')}</time></span>
                <strong>{memory.title}</strong><small>{memory.content.slice(0, 150)}{memory.content.length > 150 ? '…' : ''}</small>
              </button>
            ))}
            {!loading && !error && memories.length === 0 && <div className="brain-empty"><Icon name="brain" size={20} /><strong>{query || category !== 'all' ? 'Nenhum resultado encontrado.' : 'Sua memória começa aqui.'}</strong><span>{query || category !== 'all' ? 'Tente outro termo ou categoria.' : 'Crie uma nota ou salve explicitamente uma informação para o Jarvis.'}</span></div>}
            {!loading && !error && (page > 0 || hasMore) && <div className="brain-pagination"><button type="button" className="button-secondary" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0}>ANTERIOR</button><span>PÁGINA {page + 1}</span><button type="button" className="button-secondary" onClick={() => setPage((value) => value + 1)} disabled={!hasMore}>PRÓXIMA</button></div>}
          </div>
          <aside className="brain-detail" aria-live="polite">
            {selected && !editorOpen ? <>
              <div className="brain-detail-top"><span className="category-chip"><i />{categoryLabel(selected.category)}</span><div><button className="icon-button small" type="button" onClick={() => openEditor(selected)} aria-label="Editar memória"><Icon name="settings" size={15} /></button><button className="icon-button small brain-delete" type="button" onClick={removeMemory} aria-label="Excluir memória"><Icon name="trash" size={15} /></button></div></div>
              <h3>{selected.title}</h3><p className="brain-detail-content">{selected.content}</p>
              <dl><div><dt>ORIGEM</dt><dd>{provenanceLabel(selected.provenance)}</dd></div>{selected.source && <div><dt>REFERÊNCIA</dt><dd>{selected.source}</dd></div>}<div><dt>CRIADA</dt><dd>{new Date(selected.createdAt).toLocaleString('pt-BR')}</dd></div><div><dt>ATUALIZADA</dt><dd>{new Date(selected.updatedAt).toLocaleString('pt-BR')}</dd></div></dl>
            </> : <div className="brain-empty brain-detail-empty"><Icon name="info" size={20} /><span>Selecione uma memória para consultar ou editar.</span></div>}
          </aside>
        </div>
      </section>
    </div>
  );
}

export function LogView({ events }) {
  const [filter, setFilter] = useState('ALL');
  const filtered = events.filter((event) => filter === 'ALL' || event.level === filter);
  return (
    <div className="view-content">
      <PageHeading eyebrow="OBSERVABILIDADE / 03" title="System Log" subtitle="Registro em memória de eventos locais da interface." aside={<span className="log-count"><b>{events.length.toString().padStart(2, '0')}</b> / 40 EVENTOS</span>} />
      <section className="panel log-panel"><div className="panel-heading"><span className="panel-index">LIVE</span><div><h2>Eventos da sessão</h2><small>NENHUM DADO ENVIADO A SERVIÇOS EXTERNOS</small></div><div className="log-filters">{['ALL', 'INFO', 'SUCCESS', 'WARNING', 'ERROR'].map((level) => <button key={level} className={filter === level ? 'selected' : ''} onClick={() => setFilter(level)}>{level}</button>)}</div></div>
        <div className="log-table-wrap"><table className="log-table"><thead><tr><th>HORÁRIO</th><th>NÍVEL</th><th>CATEGORIA</th><th>EVENTO</th><th>ORIGEM</th></tr></thead><tbody>{filtered.map((event) => <tr key={event.id}><td className="mono">{event.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td><td><span className={`level-tag level-${event.level.toLowerCase()}`}><i />{event.level}</span></td><td><span className="event-category">{event.category}</span></td><td>{event.description}</td><td className="log-origin">LOCAL UI</td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state">Nenhum evento encontrado para este nível.</div>}</div>
        <div className="log-footer"><span><i className="status-pulse" /> CAPTURA LOCAL ATIVA</span><span>RETENÇÃO EM MEMÓRIA · MÁXIMO 40 REGISTROS</span></div>
      </section>
      <div className="log-notice"><Icon name="info" size={16} /><p><b>Privacidade por padrão.</b> Este log é local e registra navegação e preferências visuais. O conteúdo da conversa não é persistido nesta fase.</p></div>
    </div>
  );
}

export function ModulesView({ onOpenModule, onNavigate }) {
  return (
    <div className="view-content">
      <PageHeading eyebrow="ARQUITETURA / 04" title="Módulos do sistema" subtitle="Capacidades presentes e planejadas — sem integrações simuladas." aside={<span className="module-status-summary"><i /> 01 DEMONSTRAÇÃO LOCAL</span>} />
      <div className="module-grid">{MODULES.map((module, index) => <article className={`panel module-card${module.id === 'brain' ? ' module-available' : ''}`} key={module.id}><div className="module-card-top"><span className="module-number">0{index + 1}</span><span className={`module-status status-${module.status.toLowerCase().replaceAll(' ', '-')}`}>{module.status}</span></div><span className="module-icon"><Icon name={module.icon} size={21} /></span><h2>{module.name}</h2><p>{module.description}</p><button className="module-action" onClick={() => { if (module.id === 'brain') onNavigate('brain'); else onOpenModule(module.id); }}>{module.id === 'brain' ? 'ABRIR VISUALIZAÇÃO' : 'VER DETALHES'}<Icon name="arrow" size={15} /></button></article>)}</div>
      <div className="module-footnote"><Icon name="info" size={15} /><span>Os módulos futuros não se conectam a serviços nesta fase. A disponibilidade acima descreve somente o estado real da interface local.</span></div>
    </div>
  );
}

export function SettingsView({ preferences, onChange, persistenceStatus, profile, onSaveProfile }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  useEffect(() => setDisplayName(profile?.display_name || ''), [profile?.display_name]);

  const submitProfile = async (event) => {
    event.preventDefault();
    setProfileBusy(true);
    setProfileMessage('');
    try {
      await onSaveProfile(displayName);
      setProfileMessage('Nome de exibição atualizado.');
    } catch {
      setProfileMessage('Não foi possível atualizar o perfil. Tente novamente.');
    } finally {
      setProfileBusy(false);
    }
  };

  return (
    <div className="view-content settings-view">
      <PageHeading eyebrow="PREFERÊNCIAS / 05" title="Configurações" subtitle="Perfil da conta e preferências individuais." aside={<span className="saved-indicator"><Icon name={persistenceStatus === 'saved' ? 'check' : 'info'} size={14} /> {persistenceStatus === 'saved' ? 'SALVO NA CONTA' : persistenceStatus === 'saving' ? 'SALVANDO…' : persistenceStatus === 'error' ? 'FALHA AO SALVAR' : 'CARREGANDO'}</span>} />
      <div className="settings-layout">
        <section className="panel settings-panel account-settings">
          <div className="panel-heading"><span className="panel-index">00</span><div><h2>Conta</h2><small>PERFIL INDIVIDUAL</small></div></div>
          <form className="profile-edit-form" onSubmit={submitProfile}>
            <label htmlFor="profile-display-name">Nome de exibição</label>
            <input id="profile-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={80} required />
            <button className="button-secondary" type="submit" disabled={profileBusy || displayName.trim() === profile?.display_name}>{profileBusy ? 'SALVANDO…' : 'ATUALIZAR PERFIL'}</button>
            {profileMessage && <span role="status">{profileMessage}</span>}
          </form>
        </section>
        <section className="panel settings-panel"><div className="panel-heading"><span className="panel-index">01</span><div><h2>Apresentação</h2><small>PERSONALIZE A INTERFACE</small></div></div>
          <label className="setting-row"><span className="setting-copy"><b>Intensidade dos efeitos</b><small>Ajusta a presença de luzes e destaques.</small></span><span className="range-value">{preferences.intensity}<small>%</small></span><input className="intensity-range" type="range" min="0" max="100" value={preferences.intensity} style={{ '--range-progress': `${preferences.intensity}%` }} onChange={(event) => onChange('intensity', Number(event.target.value))} aria-label="Intensidade dos efeitos visuais" /></label>
          <div className="setting-row"><span className="setting-copy"><b>Partículas ambientais</b><small>Ativa detalhes visuais decorativos.</small></span><Toggle checked={preferences.particles} onChange={(value) => onChange('particles', value)} label="Partículas ambientais" /></div>
          <div className="setting-row"><span className="setting-copy"><b>Reduzir animações</b><small>Também respeita a preferência do sistema operacional.</small></span><Toggle checked={preferences.reducedMotion} onChange={(value) => onChange('reducedMotion', value)} label="Reduzir animações" /></div>
        </section>
        <section className="panel settings-panel"><div className="panel-heading"><span className="panel-index">02</span><div><h2>Identidade visual</h2><small>ACENTUAÇÃO E DENSIDADE</small></div></div>
          <div className="setting-block"><span className="setting-copy"><b>Cor de destaque</b><small>Aplica-se aos sinais e interações importantes.</small></span><div className="accent-options">{[{ id: 'blue', label: 'Azul ciano', color: '#37D7FF' }, { id: 'green', label: 'Verde', color: '#43E6B0' }, { id: 'violet', label: 'Violeta', color: '#A78BFA' }, { id: 'red', label: 'Vermelho', color: '#FF758F' }].map((accent) => <button key={accent.id} className={`accent-option${preferences.accent === accent.id ? ' selected' : ''}`} onClick={() => onChange('accent', accent.id)} aria-label={`Tema ${accent.label}`} aria-pressed={preferences.accent === accent.id}><i style={{ backgroundColor: accent.color }} /><span>{accent.label}</span>{preferences.accent === accent.id && <Icon name="check" size={14} />}</button>)}</div></div>
          <div className="setting-block density-setting"><span className="setting-copy"><b>Densidade da interface</b><small>Escolha o espaçamento dos painéis.</small></span><div className="density-options"><button className={preferences.density === 'comfortable' ? 'selected' : ''} onClick={() => onChange('density', 'comfortable')}><span className="density-icon comfortable-icon"><i /><i /><i /></span>Confortável</button><button className={preferences.density === 'compact' ? 'selected' : ''} onClick={() => onChange('density', 'compact')}><span className="density-icon compact-icon"><i /><i /><i /></span>Compacta</button></div></div>
        </section>
        <section className="panel privacy-panel"><span className="privacy-icon"><Icon name="settings" size={19} /></span><div><h2>Dados da conta</h2><p>Seu perfil e suas preferências são armazenados na sua conta. As políticas do banco restringem o acesso aos seus próprios registros.</p></div><span className="local-only-tag">RLS PROTECTED</span></section>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return <button className={`toggle${checked ? ' checked' : ''}`} type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span /></button>;
}
