import { Match } from '../types';

// Utility to get dates relative to today
const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

// Apenas jogos em que o Fluminense é MANDANTE (em casa / Maracanã)
export const INITIAL_MATCHES: Match[] = [
  {
    id: 'flu-fla-maracana',
    opponent: 'Flamengo',
    date: getRelativeDate(0), // Hoje!
    time: '16:00',
    competition: 'Brasileirão',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Clássico Fla-Flu decisivo na luta pelo topo da tabela! Fluminense MANDANTE. Ingressos esgotados.',
    tasks: [
      { id: 't1', text: 'Separar e passar a camisa Tricolor 🇭🇺', completed: true, priority: 'high' },
      { id: 't2', text: 'Confirmar check-in do sócio torcedor / e-ticket no celular', completed: true, priority: 'high' },
      { id: 't3', text: 'Comprar cerveja e petiscos para o pré-jogo no Maraca', completed: false, priority: 'normal' },
      { id: 't4', text: 'Combinar horário de saída com a galera (13:30 na Rampa do Metrô)', completed: false, priority: 'high' },
      { id: 't5', text: 'Conferir se a bandeira e faixa estão na mochila', completed: false, priority: 'normal' }
    ]
  },
  {
    id: 'flu-river-libertadores',
    opponent: 'River Plate',
    date: getRelativeDate(4), // Em 4 dias
    time: '21:30',
    competition: 'Copa Libertadores',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Noite de Libertadores no Maracanã! Mando tricolor com festa do pó de arroz na entrada.',
    tasks: [
      { id: 't6', text: 'Garantir ingresso no setor Sul do Maracanã', completed: true, priority: 'high' },
      { id: 't7', text: 'Vestir a armadura tricolor oficial', completed: false, priority: 'normal' },
      { id: 't8', text: 'Organizar pó de arroz para a recepção do ônibus do Flu', completed: false, priority: 'high' },
      { id: 't9', text: 'Conferir transmissão na TV / Paramount+', completed: false, priority: 'normal' }
    ]
  },
  {
    id: 'flu-spfc-brasileirao',
    opponent: 'São Paulo',
    date: getRelativeDate(9), // Em 9 dias
    time: '18:30',
    competition: 'Brasileirão',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Confronto gigante no Maracanã pelo Campeonato Brasileiro.',
    tasks: [
      { id: 't10', text: 'Fazer check-in do sócio futebol', completed: false, priority: 'high' },
      { id: 't11', text: 'Carregar celular e power bank para o jogo', completed: false, priority: 'normal' },
      { id: 't12', text: 'Confirmar ponto de encontro do pré-jogo na Barão de Mesquita', completed: false, priority: 'normal' }
    ]
  },
  {
    id: 'flu-gremio-copa',
    opponent: 'Grêmio',
    date: getRelativeDate(15), // Em 15 dias
    time: '20:00',
    competition: 'Copa do Brasil',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Jogo decisivo de volta da Copa do Brasil com apoio em massa do Maracanã.',
    tasks: [
      { id: 't13', text: 'Comprar ingressos promocionais para acompanhantes', completed: false, priority: 'high' },
      { id: 't14', text: 'Preparar sinalizadores e bandeirões no setor Sul', completed: false, priority: 'normal' }
    ]
  },
  {
    id: 'flu-palmeiras-brasileirao',
    opponent: 'Palmeiras',
    date: getRelativeDate(22), // Em 22 dias
    time: '16:00',
    competition: 'Brasileirão',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Jogo das 16h no domingo no Maracanã com casa cheia.',
    tasks: [
      { id: 't15', text: 'Ativar lembrete de check-in para sócios', completed: false, priority: 'high' },
      { id: 't16', text: 'Separar agasalho tricolor', completed: false, priority: 'normal' }
    ]
  }
];

export const PRESET_TASKS = [
  '🇭🇺 Separar e passar a camisa Tricolor oficial',
  '🎟️ Fazer check-in / comprar ingresso no Sócio Futebol',
  '📱 Baixar / validar QR Code do e-ticket no app',
  '🚗 Planejar rota e horário de saída para o estádio',
  '🍻 Combinar pré-jogo com os amigos do Flu no Maraca',
  '📺 Conferir canal / streaming de transmissão ao vivo',
  '🎉 Preparar pó de arroz para a recepção do ônibus do Tricolor',
  '🔋 Carregar power bank / celular a 100%'
];
