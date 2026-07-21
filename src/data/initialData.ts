import { Match } from '../types';

// Jogos REAIS do Fluminense conforme a busca oficial do Google (Julho e Agosto)
export const INITIAL_MATCHES: Match[] = [
  {
    id: 'flu-bragantino-2026',
    opponent: 'Bragantino',
    date: '2026-07-17',
    time: '21:30',
    competition: 'Brasileirão',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Placar: Fluminense 1 x 1 Bragantino (Partida realizada no Maracanã)',
    tasks: [] // Nenhuma sugestão inicial, o usuário adiciona apenas o que quiser
  },
  {
    id: 'gremio-flu-2026',
    opponent: 'Grêmio',
    date: '2026-07-26',
    time: '18:30',
    competition: 'Brasileirão',
    location: 'Arena do Grêmio, Porto Alegre',
    isHome: false,
    notes: 'Jogo fora de casa pelo Campeonato Brasileiro.',
    tasks: []
  },
  {
    id: 'flu-bahia-2026',
    opponent: 'Bahia',
    date: '2026-07-29',
    time: '21:30',
    competition: 'Brasileirão',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Rodada de quarta-feira à noite no Maracanã.',
    tasks: []
  },
  {
    id: 'vasco-flu-copa-j1',
    opponent: 'Vasco da Gama',
    date: '2026-08-01',
    time: '17:30',
    competition: 'Copa do Brasil',
    location: 'São Januário, Rio de Janeiro',
    isHome: false,
    notes: 'Oitavas de Final - Jogo 1 de 2 (Copa do Brasil)',
    tasks: []
  },
  {
    id: 'flu-vasco-copa-j2',
    opponent: 'Vasco da Gama',
    date: '2026-08-05',
    time: '21:30',
    competition: 'Copa do Brasil',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'Oitavas de Final - Jogo 2 de 2 decisivo no Maracanã (Copa do Brasil)',
    tasks: []
  },
  {
    id: 'botafogo-flu-2026',
    opponent: 'Botafogo',
    date: '2026-08-08',
    time: '21:00',
    competition: 'Brasileirão',
    location: 'Estádio Nilton Santos, Rio de Janeiro',
    isHome: false,
    notes: 'Clássico Vovô no Estádio Nilton Santos.',
    tasks: []
  },
  {
    id: 'flu-libertadores-oitavas',
    opponent: 'Adversário a definir',
    date: '2026-08-13',
    time: '21:30',
    competition: 'Copa Libertadores',
    location: 'Maracanã, Rio de Janeiro',
    isHome: true,
    notes: 'CONMEBOL Libertadores - Oitavas de final (Jogo 1 de 2)',
    tasks: []
  }
];

export const PRESET_TASKS: string[] = [];
