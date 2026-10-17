export const NAV_ITEMS = [
  { id: 'core', label: 'CORE', icon: 'core' },
  { id: 'brain', label: 'SECOND BRAIN', icon: 'brain' },
  { id: 'log', label: 'SYSTEM LOG', icon: 'log' },
  { id: 'modules', label: 'MODULES', icon: 'modules' },
  { id: 'settings', label: 'SETTINGS', icon: 'settings' },
];

export const NOTES = [
  { id: 'n1', title: 'Visão de longo prazo', category: 'Metas', x: 380, y: 206, summary: 'Construir uma rotina sustentável para projetos de longo prazo.' },
  { id: 'n2', title: 'Projeto Jarvis', category: 'Projetos', x: 250, y: 128, summary: 'Interface neural pessoal em desenvolvimento.' },
  { id: 'n3', title: 'Aprendizado contínuo', category: 'Aprendizado', x: 513, y: 120, summary: 'Reservar tempo semanal para estudo e experimentação.' },
  { id: 'n4', title: 'Próximo passo', category: 'Carreira', x: 560, y: 274, summary: 'Transformar ideias em entregas pequenas e verificáveis.' },
  { id: 'n5', title: 'Plano mensal', category: 'Finanças', x: 469, y: 378, summary: 'Revisar prioridades e acompanhar o orçamento mensal.' },
  { id: 'n6', title: 'Bem-estar', category: 'Saúde', x: 292, y: 355, summary: 'Manter pausas e movimento entre períodos de concentração.' },
  { id: 'n7', title: 'Tempo de qualidade', category: 'Relações', x: 173, y: 265, summary: 'Proteger momentos de presença com pessoas importantes.' },
  { id: 'n8', title: 'Protótipo de ideias', category: 'Projetos', x: 145, y: 144, summary: 'Testar uma hipótese de cada vez antes de expandir o escopo.' },
  { id: 'n9', title: 'Leitura técnica', category: 'Aprendizado', x: 590, y: 166, summary: 'Guardar referências úteis e aplicar o que foi aprendido.' },
  { id: 'n10', title: 'Ritmo equilibrado', category: 'Metas', x: 359, y: 438, summary: 'Progresso constante, com espaço para descanso e revisão.' },
];

export const NOTE_LINKS = [
  ['n1', 'n2'], ['n1', 'n3'], ['n1', 'n4'], ['n1', 'n6'], ['n1', 'n10'],
  ['n2', 'n8'], ['n2', 'n3'], ['n3', 'n9'], ['n4', 'n5'], ['n4', 'n8'],
  ['n6', 'n7'], ['n6', 'n10'], ['n5', 'n10'], ['n7', 'n8'],
];

export const CATEGORY_COLORS = {
  Metas: '#58d6f4',
  Carreira: '#8b9eff',
  Projetos: '#aa8cff',
  Finanças: '#71d7a8',
  Aprendizado: '#f0bd68',
  Saúde: '#ef829a',
  Relações: '#e79add',
};

export const MODULES = [
  { id: 'voice', name: 'Voice Interface', description: 'Interação por voz e reconhecimento de fala.', icon: 'mic', status: 'PLANNED', detail: 'A interface de voz será avaliada em uma fase futura. Nenhum microfone é acessado nesta demonstração.' },
  { id: 'brain', name: 'Second Brain', description: 'Mapa visual local de notas demonstrativas.', icon: 'brain', status: 'LOCAL DEMO', detail: 'Visualização interativa alimentada exclusivamente por dados fictícios locais.' },
  { id: 'calendar', name: 'Calendar', description: 'Organização de eventos e compromissos.', icon: 'calendar', status: 'NOT CONNECTED', detail: 'Não há calendário ou conta externa conectado nesta fase.' },
  { id: 'email', name: 'Email Intelligence', description: 'Triagem e síntese de mensagens.', icon: 'mail', status: 'NOT CONNECTED', detail: 'Este módulo não acessa e-mails; uma integração segura depende de backend futuro.' },
  { id: 'news', name: 'News Radar', description: 'Acompanhamento de tópicos selecionados.', icon: 'radar', status: 'PLANNED', detail: 'A coleta de notícias ainda não foi implementada e não há serviços externos conectados.' },
  { id: 'digest', name: 'Morning Digest', description: 'Resumo personalizado para iniciar o dia.', icon: 'sun', status: 'PLANNED', detail: 'O resumo diário é um módulo futuro e não gera conteúdo nesta demonstração.' },
];

export const DEFAULT_PREFERENCES = {
  intensity: 65,
  particles: true,
  reducedMotion: false,
  accent: 'blue',
  density: 'comfortable',
};

export const ACCENTS = {
  blue: { label: 'Azul', primary: '#37D7FF', secondary: '#5B8CFF', rgb: '55, 215, 255' },
  green: { label: 'Verde', primary: '#43E6B0', secondary: '#51b9a5', rgb: '67, 230, 176' },
  violet: { label: 'Violeta', primary: '#A78BFA', secondary: '#7C83FF', rgb: '167, 139, 250' },
  red: { label: 'Vermelho', primary: '#FF758F', secondary: '#f58d7b', rgb: '255, 117, 143' },
};
