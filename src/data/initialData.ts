import { Match } from '../types';

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'match-1',
    opponent: 'Bahia',
    date: '2026-07-29',
    time: '21:30',
    competition: 'Brasileirão',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Rodada 18 do Campeonato Brasileiro',
    tasks: [
      { id: 't-1', text: 'Levar meias Rikam', completed: false, priority: 'normal' }
    ]
  },
  {
    id: 'match-2',
    opponent: 'Vasco da Gama',
    date: '2026-08-01',
    time: '18:30',
    competition: 'Copa do Brasil',
    location: 'São Januário, Rio de Janeiro',
    isHome: false,
    notes: 'Jogo de ida das oitavas de final',
    tasks: [
      { id: 't-2', text: 'Comprar ingresso do setor visitante', completed: false, priority: 'high' }
    ]
  },
  {
    id: 'match-3',
    opponent: 'Vasco da Gama',
    date: '2026-08-05',
    time: '21:30',
    competition: 'Copa do Brasil',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Jogo de volta das oitavas de final',
    tasks: []
  },
  {
    id: 'match-4',
    opponent: 'Flamengo',
    date: '2026-08-09',
    time: '16:00',
    competition: 'Brasileirão',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Clássico Fla-Flu',
    tasks: []
  },
  {
    id: 'match-5',
    opponent: 'Botafogo',
    date: '2026-08-16',
    time: '18:30',
    competition: 'Brasileirão',
    location: 'Estádio Nilton Santos (Engenhão)',
    isHome: false,
    notes: 'Clássico Vovô',
    tasks: []
  },
  {
    id: 'match-6',
    opponent: 'LDU Quito',
    date: '2026-08-20',
    time: '21:30',
    competition: 'Copa Libertadores',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Fase eliminatória da Libertadores',
    tasks: []
  }
];

export const PRESET_TASKS: string[] = [
  'Levar meias Rikam',
  'Comprar ingressos de sócio',
  'Organizar transporte de ida e volta',
  'Separar camisa tricolor da sorte',
  'Chegar com 2h de antecedência'
];
