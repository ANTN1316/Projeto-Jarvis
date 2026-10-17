import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_COLORS, MODULES, NAV_ITEMS, NOTE_LINKS, NOTES } from './data.js';

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

export function Hud({ sessionId, onSettings, accent, onAccent, reactorState, onProfile }) {
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
        <span className="brand-live"><i /> LOCAL</span>
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
          <button className="profile-button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label="Perfil local de demonstração">
            <span className="avatar"><Icon name="user" size={17} /></span><span className="profile-copy">LOCAL<span>DEMO</span></span>
          </button>
          {profileOpen && <div className="profile-popover"><b>Perfil de demonstração</b><span>Esta sessão é local e não autenticada.</span><button onClick={() => { setProfileOpen(false); onProfile(); }}>ENTENDI <Icon name="arrow" size={13} /></button></div>}
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

export function CoreView({ reactorState, onToggleListening, messages, onSend, processing, onInterrupt, onClear, onNavigate }) {
  return (
    <div className="view-content core-view">
      <PageHeading eyebrow="J.A.R.V.I.S. / CENTRAL DE COMANDO" title="Núcleo de inteligência" subtitle="Interface local para interação e visualização demonstrativa." aside={<StateLabel state={reactorState} />} />
      <div className="core-layout">
        <aside className="side-column left-column">
          <section className="panel status-panel">
            <div className="panel-heading"><span className="panel-index">01</span><div><h2>Diagnóstico</h2><small>ESTADO DA INTERFACE</small></div><span className="tiny-live">LOCAL</span></div>
            <div className="diagnostic-graphic"><div className="diagnostic-crosshair"><span /><i /></div><div className="diagnostic-readout"><small>CORE LOAD</small><strong>—<em>%</em></strong><span>NÃO MEDIDO</span></div></div>
            <Metric label="Interface" value="ATIVA" />
            <Metric label="Rede externa" value="NÃO VERIFICADA" />
            <Metric label="Serviços" value="0 CONECTADOS" />
            <div className="panel-footnote"><Icon name="info" size={13} /> Sem integração com backend nesta fase.</div>
          </section>
          <section className="panel quick-panel">
            <div className="panel-heading"><span className="panel-index">02</span><div><h2>Atalhos</h2><small>COMANDOS DE NAVEGAÇÃO</small></div></div>
            <button className="quick-link" onClick={() => onNavigate('brain')}><Icon name="brain" /><span>Explorar memória<small>Second Brain · demonstração</small></span><Icon name="arrow" size={15} /></button>
            <button className="quick-link" onClick={() => onNavigate('modules')}><Icon name="modules" /><span>Ver módulos<small>Estados e disponibilidade</small></span><Icon name="arrow" size={15} /></button>
          </section>
        </aside>
        <section className="center-column" aria-label="Interação com o núcleo">
          <div className="reactor-stage"><div className="stage-topline"><span>NEURAL CORE <i>·</i> V.01</span><span>INTERFACE ONLY</span></div><Reactor state={reactorState} onActivate={onToggleListening} /><div className="reactor-state-copy"><StateLabel state={reactorState} /><p>{reactorState === 'listening' ? 'Demonstração ativa · áudio não capturado' : reactorState === 'thinking' ? 'Analisando comando local...' : reactorState === 'speaking' ? 'Resposta gerada pelo motor local' : reactorState === 'success' ? 'Interação local finalizada' : 'Toque no núcleo para iniciar uma escuta simulada'}</p></div><div className="stage-bottomline"><span>LATÊNCIA LOCAL <b>—</b></span><span><i className="mini-dot" /> SISTEMA PRONTO</span><span>NO BACKEND</span></div></div>
          <CommandConsole messages={messages} onSend={onSend} processing={processing} onInterrupt={onInterrupt} onClear={onClear} onToggleListening={onToggleListening} reactorState={reactorState} />
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

function CommandConsole({ messages, onSend, processing, onInterrupt, onClear, onToggleListening, reactorState }) {
  const [draft, setDraft] = useState('');
  const messageListRef = useRef(null);
  useEffect(() => {
    if (messageListRef.current) messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, processing]);
  const submit = (event) => {
    event.preventDefault();
    if (!draft.trim() || processing) return;
    onSend(draft);
    setDraft('');
  };
  return (
    <section className="panel command-console">
      <div className="console-header"><div className="console-assistant"><span className="assistant-glyph"><Icon name="spark" size={16} /></span><span><b>J.A.R.V.I.S.</b><small>ASSISTENTE LOCAL · DEMONSTRAÇÃO</small></span></div><div className="console-actions"><span className="console-status"><i /> {processing ? 'PROCESSANDO' : 'PRONTO'}</span><button className="icon-button small" onClick={onClear} aria-label="Limpar conversa local" title="Limpar conversa"><Icon name="trash" size={15} /></button></div></div>
      <div className="message-list" ref={messageListRef} aria-live="polite" aria-label="Histórico de conversa">
        {messages.map((message) => <div className={`message message-${message.role}`} key={message.id}><span className="message-avatar">{message.role === 'user' ? 'U' : <Icon name="spark" size={13} />}</span><div className="message-body"><div><b>{message.role === 'user' ? 'VOCÊ' : 'J.A.R.V.I.S.'}</b><time>{message.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time></div><p>{message.text}</p></div></div>)}
        {processing && <div className="message message-assistant typing-message"><span className="message-avatar"><Icon name="spark" size={13} /></span><span className="typing-dots" aria-label="Processando"><i /><i /><i /></span></div>}
        {!messages.length && <div className="empty-conversation"><Icon name="spark" size={17} /> Histórico local vazio. Envie um comando para começar.</div>}
      </div>
      <div className="command-suggestions"><span>EXPERIMENTE</span>{['Olá, Jarvis.', 'Status do sistema.', 'Abrir Second Brain.'].map((suggestion) => <button key={suggestion} onClick={() => { setDraft(suggestion); }} disabled={processing}>{suggestion}</button>)}</div>
      <form className="command-form" onSubmit={submit}>
        <label htmlFor="command-input" className="sr-only">Digite um comando para o assistente local</label>
        <textarea id="command-input" rows="1" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(event); } }} placeholder="Digite um comando demonstrativo..." disabled={processing} />
        <span className="input-hint">ENTER PARA ENVIAR · SHIFT + ENTER PARA NOVA LINHA</span>
        <button className={`mic-demo-button${reactorState === 'listening' ? ' active' : ''}`} type="button" onClick={onToggleListening} disabled={processing} aria-pressed={reactorState === 'listening'} aria-label={reactorState === 'listening' ? 'Encerrar escuta simulada; nenhum áudio está sendo capturado' : 'Iniciar escuta simulada; nenhum áudio será capturado'} title="Escuta simulada · áudio não capturado"><Icon name="mic" size={16} /></button>
        <button className="send-button" type="submit" disabled={!draft.trim() || processing} aria-label="Enviar comando"><Icon name="send" size={17} /></button>
        {processing && <button type="button" className="interrupt-button" onClick={onInterrupt} aria-label="Interromper interação"><Icon name="stop" size={16} /></button>}
      </form>
      <div className="console-disclaimer"><Icon name="info" size={13} /> Motor local de demonstração · sem IA externa · microfone não conectado</div>
    </section>
  );
}

export function BrainView() {
  const [selectedId, setSelectedId] = useState('n2');
  const [zoom, setZoom] = useState(1);
  const [dragState, setDragState] = useState(null);
  const [positions, setPositions] = useState(() => Object.fromEntries(NOTES.map((note) => [note.id, { x: note.x, y: note.y }])));
  const svgRef = useRef(null);
  const selected = NOTES.find((note) => note.id === selectedId);
  const categories = useMemo(() => [...new Set(NOTES.map((note) => note.category))], []);
  const pointFromEvent = (event) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 720, y: ((event.clientY - rect.top) / rect.height) * 500 };
  };
  const moveNode = (event) => {
    if (!dragState) return;
    const point = pointFromEvent(event);
    if (!point) return;
    setPositions((current) => ({ ...current, [dragState.id]: { x: Math.min(670, Math.max(50, point.x / zoom)), y: Math.min(455, Math.max(45, point.y / zoom)) } }));
  };
  return (
    <div className="view-content brain-view">
      <PageHeading eyebrow="MEMÓRIA VISUAL / 02" title="Second Brain" subtitle="Mapa de conhecimento local com conteúdo inteiramente fictício." aside={<span className="demo-stamp"><i /> DADOS DE DEMONSTRAÇÃO</span>} />
      <div className="brain-summary"><div className="summary-card"><span>NOTAS VISUAIS</span><strong>{NOTES.length.toString().padStart(2, '0')}</strong><small>NÓS NO MAPA</small></div><div className="summary-card"><span>CATEGORIAS</span><strong>{categories.length.toString().padStart(2, '0')}</strong><small>GRUPOS DE CONHECIMENTO</small></div><div className="summary-card"><span>CONEXÕES</span><strong>{NOTE_LINKS.length.toString().padStart(2, '0')}</strong><small>RELAÇÕES LOCAIS</small></div><div className="summary-card summary-note"><Icon name="info" size={16} /><span>Exemplos fictícios para explorar a visualização. Nenhuma memória pessoal está armazenada.</span></div></div>
      <div className="brain-layout">
        <section className="panel graph-panel">
          <div className="panel-heading"><span className="panel-index">MAPA 01</span><div><h2>Rede de conhecimento</h2><small>ARRASTE OS NÓS · SELECIONE PARA VER DETALHES</small></div><div className="zoom-controls"><button className="icon-button small" onClick={() => setZoom((value) => Math.max(.75, Number((value - .1).toFixed(2))))} aria-label="Diminuir zoom"><Icon name="minus" size={15} /></button><span>{Math.round(zoom * 100)}%</span><button className="icon-button small" onClick={() => setZoom((value) => Math.min(1.35, Number((value + .1).toFixed(2))))} aria-label="Aumentar zoom"><Icon name="plus" size={15} /></button><button className="icon-button small reset-zoom" onClick={() => { setZoom(1); setPositions(Object.fromEntries(NOTES.map((note) => [note.id, { x: note.x, y: note.y }]))); }} aria-label="Redefinir mapa">↺</button></div></div>
          <div className="graph-wrap"><svg ref={svgRef} viewBox="0 0 720 500" className="brain-graph" role="img" aria-label="Grafo interativo de notas fictícias" onPointerMove={moveNode} onPointerUp={() => setDragState(null)} onPointerCancel={() => setDragState(null)} onPointerLeave={() => setDragState(null)}>
            <defs><pattern id="graph-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(117,165,196,.2)" /></pattern><radialGradient id="graph-aura"><stop stopColor="var(--accent-primary)" stopOpacity=".13" /><stop offset="1" stopColor="var(--accent-primary)" stopOpacity="0" /></radialGradient></defs>
            <rect width="720" height="500" fill="url(#graph-dots)" /><circle cx="380" cy="245" r="190" fill="url(#graph-aura)" />
            <g transform={`scale(${zoom})`}>
              {NOTE_LINKS.map(([from, to]) => <line key={`${from}-${to}`} x1={positions[from].x} y1={positions[from].y} x2={positions[to].x} y2={positions[to].y} className={`graph-edge${from === selectedId || to === selectedId ? ' edge-active' : ''}`} />)}
              {NOTES.map((note) => {
                const p = positions[note.id];
                const color = CATEGORY_COLORS[note.category];
                return <g key={note.id} transform={`translate(${p.x} ${p.y})`} className={`graph-node${note.id === selectedId ? ' selected' : ''}${dragState?.id === note.id ? ' dragging' : ''}`} role="button" tabIndex="0" aria-label={`${note.title}, categoria ${note.category}`} onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setSelectedId(note.id); setDragState({ id: note.id }); }} onPointerUp={() => setDragState(null)} onClick={() => setSelectedId(note.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(note.id); } }}>
                  <circle r={note.id === 'n1' ? 13 : 9} fill={`${color}22`} stroke={color} className="node-halo" /><circle r={note.id === 'n1' ? 5 : 4} fill={color} /><text x="15" y="4">{note.title}</text>
                </g>;
              })}
            </g>
          </svg></div>
          <div className="graph-legend">{categories.map((category) => <span key={category}><i style={{ backgroundColor: CATEGORY_COLORS[category] }} />{category}</span>)}</div>
        </section>
        <aside className="panel note-detail">
          <div className="panel-heading"><span className="panel-index">DETALHE</span><div><h2>Nó selecionado</h2><small>INFORMAÇÃO DE DEMONSTRAÇÃO</small></div></div>
          {selected && <div className="note-content"><span className="category-chip" style={{ '--category-color': CATEGORY_COLORS[selected.category] }}><i />{selected.category}</span><h3>{selected.title}</h3><p>{selected.summary}</p><div className="note-meta"><span>ID DA NOTA</span><b>{selected.id.toUpperCase()}</b></div><div className="note-meta"><span>ORIGEM</span><b>CONTEÚDO FICTÍCIO</b></div><div className="related-notes"><span>NOTAS RELACIONADAS</span>{NOTE_LINKS.filter(([a, b]) => a === selected.id || b === selected.id).map(([a, b]) => { const relatedId = a === selected.id ? b : a; const note = NOTES.find((item) => item.id === relatedId); return <button key={relatedId} onClick={() => setSelectedId(relatedId)}><i style={{ backgroundColor: CATEGORY_COLORS[note.category] }} />{note.title}<Icon name="arrow" size={13} /></button>; })}</div></div>}
          <div className="panel-footnote"><Icon name="info" size={13} /> O mapa existe apenas nesta sessão e usa dados de exemplo.</div>
        </aside>
      </div>
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
      <div className="log-notice"><Icon name="info" size={16} /><p><b>Privacidade por padrão.</b> O log registra somente navegação, comandos demonstrativos e preferências visuais. Não há backend, credenciais ou dados pessoais neste sistema.</p></div>
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

export function SettingsView({ preferences, onChange }) {
  return (
    <div className="view-content settings-view">
      <PageHeading eyebrow="PREFERÊNCIAS / 05" title="Configurações" subtitle="Ajustes visuais armazenados somente neste navegador." aside={<span className="saved-indicator"><Icon name="check" size={14} /> SALVAMENTO LOCAL</span>} />
      <div className="settings-layout">
        <section className="panel settings-panel"><div className="panel-heading"><span className="panel-index">01</span><div><h2>Apresentação</h2><small>PERSONALIZE A INTERFACE</small></div></div>
          <label className="setting-row"><span className="setting-copy"><b>Intensidade dos efeitos</b><small>Ajusta a presença de luzes e destaques.</small></span><span className="range-value">{preferences.intensity}<small>%</small></span><input className="intensity-range" type="range" min="0" max="100" value={preferences.intensity} style={{ '--range-progress': `${preferences.intensity}%` }} onChange={(event) => onChange('intensity', Number(event.target.value))} aria-label="Intensidade dos efeitos visuais" /></label>
          <div className="setting-row"><span className="setting-copy"><b>Partículas ambientais</b><small>Ativa detalhes visuais decorativos.</small></span><Toggle checked={preferences.particles} onChange={(value) => onChange('particles', value)} label="Partículas ambientais" /></div>
          <div className="setting-row"><span className="setting-copy"><b>Reduzir animações</b><small>Também respeita a preferência do sistema operacional.</small></span><Toggle checked={preferences.reducedMotion} onChange={(value) => onChange('reducedMotion', value)} label="Reduzir animações" /></div>
        </section>
        <section className="panel settings-panel"><div className="panel-heading"><span className="panel-index">02</span><div><h2>Identidade visual</h2><small>ACENTUAÇÃO E DENSIDADE</small></div></div>
          <div className="setting-block"><span className="setting-copy"><b>Cor de destaque</b><small>Aplica-se aos sinais e interações importantes.</small></span><div className="accent-options">{[{ id: 'blue', label: 'Azul ciano', color: '#37D7FF' }, { id: 'green', label: 'Verde', color: '#43E6B0' }, { id: 'violet', label: 'Violeta', color: '#A78BFA' }, { id: 'red', label: 'Vermelho', color: '#FF758F' }].map((accent) => <button key={accent.id} className={`accent-option${preferences.accent === accent.id ? ' selected' : ''}`} onClick={() => onChange('accent', accent.id)} aria-label={`Tema ${accent.label}`} aria-pressed={preferences.accent === accent.id}><i style={{ backgroundColor: accent.color }} /><span>{accent.label}</span>{preferences.accent === accent.id && <Icon name="check" size={14} />}</button>)}</div></div>
          <div className="setting-block density-setting"><span className="setting-copy"><b>Densidade da interface</b><small>Escolha o espaçamento dos painéis.</small></span><div className="density-options"><button className={preferences.density === 'comfortable' ? 'selected' : ''} onClick={() => onChange('density', 'comfortable')}><span className="density-icon comfortable-icon"><i /><i /><i /></span>Confortável</button><button className={preferences.density === 'compact' ? 'selected' : ''} onClick={() => onChange('density', 'compact')}><span className="density-icon compact-icon"><i /><i /><i /></span>Compacta</button></div></div>
        </section>
        <section className="panel privacy-panel"><span className="privacy-icon"><Icon name="settings" size={19} /></span><div><h2>Preferências locais</h2><p>São salvas no localStorage deste navegador. Nenhuma conta, senha, chave de API ou informação sensível é solicitada ou armazenada.</p></div><span className="local-only-tag">LOCAL ONLY</span></section>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return <button className={`toggle${checked ? ' checked' : ''}`} type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span /></button>;
}
