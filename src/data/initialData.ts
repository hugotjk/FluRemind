import { Match } from '../types';

// Utility to get dates relative to today
const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'flu-fla-today',
    opponent: 'Flamengo',
    date: getRelativeDate(0), // Today!
    time: '16:00',
    competition: 'Brasileirão',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Clássico Fla-Flu decisivo na luta pelo topo da tabela! Ingressos esgotados.',
    tasks: [
      { id: 't1', text: 'Separar e passar a camisa Tricolor 🇭🇺', completed: true, priority: 'high' },
      { id: 't2', text: 'Confirmar check-in do sócio torcedor / e-ticket no celular', completed: true, priority: 'high' },
      { id: 't3', text: 'Comprar cerveja e petiscos para o pré-jogo', completed: false, priority: 'normal' },
      { id: 't4', text: 'Combinar horário de saída com a galera (13:30 na Rampa do Metrô)', completed: false, priority: 'high' },
      { id: 't5', text: 'Conferir se a bandeira e faixa estão na mochila', completed: false, priority: 'normal' }
    ]
  },
  {
    id: 'flu-river-libertadores',
    opponent: 'River Plate',
    date: getRelativeDate(3), // In 3 days
    time: '21:30',
    competition: 'Copa Libertadores',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Rodada crucial da Fase de Grupos da Libertadores! Maraca tricolor lotado.',
    tasks: [
      { id: 't6', text: 'Garantir ingresso no setor Sul', completed: true, priority: 'high' },
      { id: 't7', text: 'Vestir a armadura tricolor oficial', completed: false, priority: 'normal' },
      { id: 't8', text: 'Organizar pó de arroz para a recepção do ônibus do Flu', completed: false, priority: 'high' },
      { id: 't9', text: 'Conferir transmissão na TV / Paramount+', completed: false, priority: 'normal' }
    ]
  },
  {
    id: 'flu-vasco-carioca',
    opponent: 'Vasco da Gama',
    date: getRelativeDate(7), // In 7 days
    time: '18:30',
    competition: 'Campeonato Carioca',
    location: 'São Januário, Rio de Janeiro',
    isHome: false,
    notes: 'Clássico dos Gigantes fora de casa.',
    tasks: [
      { id: 't10', text: 'Comprar ingresso visitante', completed: false, priority: 'high' },
      { id: 't11', text: 'Verificar esquema de segurança e transporte para o estádio', completed: false, priority: 'high' },
      { id: 't12', text: 'Separar manto de visitante', completed: false, priority: 'normal' }
    ]
  },
  {
    id: 'flu-inter-copa',
    opponent: 'Internacional',
    date: getRelativeDate(12), // In 12 days
    time: '20:00',
    competition: 'Copa do Brasil',
    location: 'Beira-Rio, Porto Alegre',
    isHome: false,
    notes: 'Jogo de ida das oitavas de final da Copa do Brasil.',
    tasks: [
      { id: 't13', text: 'Pesquisar voo / hospedagem ou ponto de encontro da torcida no RS', completed: false, priority: 'normal' },
      { id: 't14', text: 'Agendar lembrete da transmissão ao vivo', completed: false, priority: 'normal' }
    ]
  },
  {
    id: 'flu-bota-brasileirao',
    opponent: 'Botafogo',
    date: getRelativeDate(18),
    time: '19:00',
    competition: 'Brasileirão',
    location: 'Nilton Santos (Engenhão), Rio de Janeiro',
    isHome: false,
    notes: 'Clássico Vovô no Engenhão.',
    tasks: [
      { id: 't15', text: 'Comprar ingresso setor visitante', completed: false, priority: 'high' },
      { id: 't16', text: 'Separar manto tricolor', completed: false, priority: 'normal' }
    ]
  }
];

export const PRESET_TASKS = [
  '🇭🇺 Separar e passar a camisa Tricolor oficial',
  '🎟️ Fazer check-in / comprar ingresso no Sócio Futebol',
  '📱 Baixar / validar QR Code do e-ticket no app',
  '🚗 Planejar rota e horário de saída para o estádio',
  '🍻 Combinar pré-jogo com os amigos do Flu',
  '📺 Conferir canal / streaming de transmissão',
  '🎉 Preparar pó de arroz para a festa na arquibancada',
  '🔋 Carregar power bank / celular a 100%'
];
