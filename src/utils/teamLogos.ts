import { Match } from '../types';

export const FLUMINENSE_LOGO = 'https://upload.wikimedia.org/wikipedia/pt/a/a3/Fluminense_FC_escudo.svg';

const TEAM_LOGOS_MAP: Record<string, string> = {
  'fluminense': FLUMINENSE_LOGO,
  'vasco': 'https://upload.wikimedia.org/wikipedia/pt/a/ac/CR_Vasco_da_Gama.svg',
  'vasco da gama': 'https://upload.wikimedia.org/wikipedia/pt/a/ac/CR_Vasco_da_Gama.svg',
  'cr vasco da gama': 'https://upload.wikimedia.org/wikipedia/pt/a/ac/CR_Vasco_da_Gama.svg',
  'flamengo': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_braz_logo.svg',
  'botafogo': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg',
  'palmeiras': 'https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg',
  'sao paulo': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg',
  'são paulo': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg',
  'corinthians': 'https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.svg',
  'santos': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Santos_Logo.svg',
  'gremio': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Gremio_logo.svg',
  'grêmio': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Gremio_logo.svg',
  'internacional': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg',
  'inter': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg',
  'bahia': 'https://upload.wikimedia.org/wikipedia/pt/2/2c/Esporte_Clube_Bahia_logo.svg',
  'atletico mineiro': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Atletico_mineiro_galo.svg',
  'atlético mineiro': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Atletico_mineiro_galo.svg',
  'atletico-mg': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Atletico_mineiro_galo.svg',
  'galo': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Atletico_mineiro_galo.svg',
  'athletico': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Athletico_Paranaense_2018.svg',
  'athletico paranaense': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Athletico_Paranaense_2018.svg',
  'atletico paranaense': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Athletico_Paranaense_2018.svg',
  'cruzeiro': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Cruzeiro_Esporte_Clube_%28logo_2021%29.svg',
  'fortaleza': 'https://upload.wikimedia.org/wikipedia/commons/4/4c/FortalezaEC.svg',
  'ceara': 'https://upload.wikimedia.org/wikipedia/commons/3/38/Cear%C3%A1_Sporting_Club_logo.svg',
  'ceará': 'https://upload.wikimedia.org/wikipedia/commons/3/38/Cear%C3%A1_Sporting_Club_logo.svg',
  'red bull bragantino': 'https://upload.wikimedia.org/wikipedia/pt/9/9e/RedBullBragantino.svg',
  'bragantino': 'https://upload.wikimedia.org/wikipedia/pt/9/9e/RedBullBragantino.svg',
  'juventude': 'https://upload.wikimedia.org/wikipedia/commons/d/df/EC_Juventude.svg',
  'criciuma': 'https://upload.wikimedia.org/wikipedia/commons/1/10/Crici%C3%BAma_Esporte_Clube_logo.svg',
  'criciúma': 'https://upload.wikimedia.org/wikipedia/commons/1/10/Crici%C3%BAma_Esporte_Clube_logo.svg',
  'vitoria': 'https://upload.wikimedia.org/wikipedia/commons/8/80/Esporte_Clube_Vit%C3%B3ria_logo.svg',
  'vitória': 'https://upload.wikimedia.org/wikipedia/commons/8/80/Esporte_Clube_Vit%C3%B3ria_logo.svg',
  'ldu': 'https://upload.wikimedia.org/wikipedia/commons/2/22/Escudo_da_LDU.svg',
  'ldu quito': 'https://upload.wikimedia.org/wikipedia/commons/2/22/Escudo_da_LDU.svg',
  'river plate': 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Escudo_del_C_A_River_Plate.svg',
  'boca juniors': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Boca_Juniors_logo13.svg'
};

/**
 * Capitalizes opponent name properly (e.g. "vasco da gama" -> "Vasco da Gama")
 */
export function formatOpponentName(name: string): string {
  if (!name) return 'Adversário';
  if (name.toUpperCase() === 'FLUMINENSE' || name.toUpperCase() === 'FLU') {
    return 'FLUMINENSE';
  }

  const lowerWords = ['de', 'da', 'do', 'das', 'dos', 'e', 'v'];
  return (name || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && lowerWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Gets the crest URL for an opponent team
 */
export function getOpponentLogo(name: string, customLogo?: string): string {
  if (customLogo && customLogo.trim()) return customLogo.trim();
  if (!name) return 'https://upload.wikimedia.org/wikipedia/commons/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg';

  const clean = (name || '').trim().toLowerCase();
  
  if (TEAM_LOGOS_MAP[clean]) {
    return TEAM_LOGOS_MAP[clean];
  }

  // Partial match search
  for (const [key, logo] of Object.entries(TEAM_LOGOS_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return logo;
    }
  }

  // Generic crest fallback SVG placeholder via SVG data URI
  return 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Fluminense_FC_escudo.svg';
}

/**
 * Formats match teams according to Home (Mandante) vs Away (Visitante) rules
 */
export function formatMatchTeams(match: Match) {
  const formattedOpponent = formatOpponentName(match.opponent || 'Adversário');
  const opponentLogoUrl = getOpponentLogo(match.opponent || '', match.opponentLogo);

  if (match.isHome) {
    // Fluminense é Mandante (Casa)
    return {
      homeTeam: 'FLUMINENSE',
      homeLogo: FLUMINENSE_LOGO,
      homeIsFlu: true,
      awayTeam: formattedOpponent,
      awayLogo: opponentLogoUrl,
      awayIsFlu: false
    };
  } else {
    // Adversário é Mandante (Fora de Casa)
    return {
      homeTeam: formattedOpponent,
      homeLogo: opponentLogoUrl,
      homeIsFlu: false,
      awayTeam: 'FLUMINENSE',
      awayLogo: FLUMINENSE_LOGO,
      awayIsFlu: true
    };
  }
}

/**
 * Merges updated Google Calendar / remote match data while PRESERVING user checklist tasks & reminders
 */
export function mergeMatchesPreservingTasks(existingMatches: Match[], incomingMatches: Match[]): Match[] {
  const safeExisting = Array.isArray(existingMatches) ? existingMatches : [];
  const safeIncoming = Array.isArray(incomingMatches) ? incomingMatches : [];

  if (safeIncoming.length === 0) return safeExisting;

  const existingMap = new Map<string, Match>();
  
  safeExisting.forEach(m => {
    if (m && m.id) {
      existingMap.set(m.id, m);
    }
    if (m && m.opponent) {
      const opp = (m.opponent || '').trim().toLowerCase();
      const comp = (m.competition || '').trim().toLowerCase();
      const nameKey = `${opp}_${comp}`;
      existingMap.set(nameKey, m);
    }
  });

  const merged: Match[] = safeIncoming.map(inc => {
    if (!inc) return inc;
    const opp = (inc.opponent || '').trim().toLowerCase();
    const comp = (inc.competition || '').trim().toLowerCase();
    const nameKey = `${opp}_${comp}`;
    const matchedExisting = (inc.id ? existingMap.get(inc.id) : null) || existingMap.get(nameKey);

    if (matchedExisting) {
      return {
        ...inc,
        id: matchedExisting.id, // Keep consistent ID
        // Preserve user's checklist tasks if incoming doesn't have tasks or existing has tasks
        tasks: (inc.tasks && inc.tasks.length > 0) ? inc.tasks : (matchedExisting.tasks || []),
        notes: inc.notes || matchedExisting.notes
      };
    }

    return inc;
  });

  // Keep any existing match that had tasks created if not present in incoming
  safeExisting.forEach(m => {
    if (m && m.tasks && m.tasks.length > 0) {
      const opp = (m.opponent || '').toLowerCase();
      const existsInMerged = merged.some(item => item && (item.id === m.id || (item.opponent || '').toLowerCase() === opp));
      if (!existsInMerged) {
        merged.push(m);
      }
    }
  });

  // Sort by date and time
  return merged.sort((a, b) => `${a?.date || ''}T${a?.time || '00:00'}`.localeCompare(`${b?.date || ''}T${b?.time || '00:00'}`));
}
