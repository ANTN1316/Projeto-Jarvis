import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ACCENTS, DEFAULT_PREFERENCES, MODULES, NAV_ITEMS } from './data.js';
import {
  BrainView, CoreView, Hud, Icon, LogView, ModulesView, Navigation, SettingsView,
} from './components.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { loadPreferences, savePreferences, signOut } from './services/userData.js';

const initialMessages = [
  { id: 'welcome', role: 'assistant', text: 'Interface local inicializada. Os comandos disponíveis estão prontos para demonstração.', time: new Date() },
];

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
  if (/^(oi|ola)( jarvis)?$/.test(normalized)) {
    return { text: 'Olá. Estou operando em modo de demonstração local. Como posso ajudar?', route: null };
  }
  if (/status do sistema|status$/.test(normalized)) {
    return { text: 'Interface ativa · sessão local · serviços externos não verificados · integrações não conectadas.', route: null };
  }
  if (/abrir second brain|second brain/.test(normalized)) {
    return { text: 'Abrindo o mapa demonstrativo do Second Brain.', route: 'brain' };
  }
  if (/mostrar modulos|abrir modulos|modulos/.test(normalized)) {
    return { text: 'Exibindo o catálogo de módulos e seus estados atuais.', route: 'modules' };
  }
  if (/abrir configuracoes|configuracoes|settings/.test(normalized)) {
    return { text: 'Abrindo as preferências visuais locais.', route: 'settings' };
  }
  if (/voltar ao nucleo|voltar para o nucleo|abrir core/.test(normalized)) {
    return { text: 'Retornando ao núcleo de interação.', route: 'core' };
  }
  return { text: 'Esse comando ainda não está implementado nesta demonstração local.', route: null };
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
  const [messages, setMessages] = useState(initialMessages);
  const [events, setEvents] = useState(() => [createEvent('SYSTEM', 'Interface local inicializada.', 'SUCCESS')]);
  const [processing, setProcessing] = useState(false);
  const [moduleDetail, setModuleDetail] = useState(null);
  const [notice, setNotice] = useState('');
  const [sessionId] = useState(() => `JRV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  const previousReactorState = useRef('idle');
  const processingRef = useRef(false);
  const timersRef = useRef([]);
  const noticeTimerRef = useRef(null);
  const skipNextPreferenceSave = useRef(false);
  const preferenceLoadFailed = useRef(false);

  const logEvent = useCallback((category, description, level = 'INFO') => {
    setEvents((current) => [createEvent(category, description, level), ...current].slice(0, 40));
  }, []);

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

  const sendCommand = useCallback((rawCommand) => {
    const command = rawCommand.trim();
    if (!command || processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    setMessages((current) => [...current, {
      id: `${Date.now()}-user`, role: 'user', text: command, time: new Date(),
    }].slice(-50));
    logEvent('COMMAND', `Comando demonstrativo enviado: “${command.slice(0, 90)}”.`);
    dispatchReactor('thinking');
    const result = getCommandResult(command);
    const firstTimer = window.setTimeout(() => {
      dispatchReactor('speaking');
      setMessages((current) => [...current, {
        id: `${Date.now()}-assistant`, role: 'assistant', text: result.text, time: new Date(),
      }].slice(-50));
      if (result.route) changeRoute(result.route);
      const secondTimer = window.setTimeout(() => {
        dispatchReactor('success');
        const finalTimer = window.setTimeout(() => {
          dispatchReactor('idle');
          processingRef.current = false;
          setProcessing(false);
        }, 850);
        timersRef.current.push(finalTimer);
      }, 450);
      timersRef.current.push(secondTimer);
    }, 560);
    timersRef.current.push(firstTimer);
  }, [changeRoute, logEvent]);

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
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
    processingRef.current = false;
    setProcessing(false);
    dispatchReactor('idle');
    logEvent('REACTOR', 'Interação local interrompida.', 'WARNING');
    showNotice('Interação interrompida.');
  }, [logEvent, showNotice]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    logEvent('COMMAND', 'Histórico local da conversa limpo.');
    showNotice('Conversa local limpa.');
  }, [logEvent, showNotice]);

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
              onClear={clearConversation}
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
