export const NAV_ITEMS = [
  { id: 'core', label: 'CORE', icon: 'core' },
  { id: 'brain', label: 'SECOND BRAIN', icon: 'brain' },
  { id: 'log', label: 'SYSTEM LOG', icon: 'log' },
  { id: 'modules', label: 'MODULES', icon: 'modules' },
  { id: 'settings', label: 'SETTINGS', icon: 'settings' },
];

export const MODULES = [
  { id: 'voice', name: 'Voice Interface', description: 'Interação por voz e reconhecimento de fala.', icon: 'mic', status: 'PLANNED', detail: 'A interface de voz será avaliada em uma fase futura. Nenhum microfone é acessado nesta demonstração.' },
  { id: 'brain', name: 'Second Brain', description: 'Notas pessoais privadas com busca e recuperação contextual.', icon: 'brain', status: 'AVAILABLE', detail: 'Conhecimento pessoal persistido na sua conta, com busca textual, controle de origem e isolamento por RLS.' },
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
