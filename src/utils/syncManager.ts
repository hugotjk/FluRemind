import { Match, TelegramSettings, NotificationLog } from '../types';
import { INITIAL_MATCHES } from '../data/initialData';

const LOCAL_STORAGE_MATCHES_KEY = 'fluremind_matches_v6';
const LOCAL_STORAGE_TELEGRAM_KEY = 'fluremind_telegram_v6';
const LOCAL_STORAGE_LOGS_KEY = 'fluremind_logs_v6';

// Dedicated cloud JSON blob ID for global cross-device synchronization
const GLOBAL_CLOUD_BLOB_ID = '019f865f-95dd-7d09-95ac-045376f38d45';

export interface CloudPayload {
  matches: Match[];
  telegramSettings?: TelegramSettings;
  updatedAt?: string;
}

// Safe JSON fetch wrapper
export async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<{ ok: boolean; data?: T; error?: string; status?: number }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {})
      }
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        status: res.status,
        error: `O servidor retornou formato não-JSON (${res.status}).`
      };
    }

    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: data.error || data.description || `Erro HTTP ${res.status}`,
        data
      };
    }

    return { ok: true, data };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || 'Erro de rede ao comunicar com o servidor'
    };
  }
}

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1BgoimzpqdL5UXpCw12vz4BiSuRYxIlGr/export?format=csv';

export function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

export function parseGoogleSheetCSV(text: string): Match[] {
  const lines = text.split(/\r?\n/);
  const result: Match[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line);
    const ordStr = cols[0] ? cols[0].trim() : '';
    const ordNum = Number(ordStr);
    if (!ordStr || isNaN(ordNum)) continue;

    const rawData = cols[1] ? cols[1].trim() : '';
    const rawHora = cols[2] ? cols[2].trim() : '';
    const comp = cols[3] ? cols[3].trim() : '';
    const mandante = cols[4] ? cols[4].trim() : '';
    const visitante = cols[5] ? cols[5].trim() : '';
    const fotoMandante = cols[6] ? cols[6].trim() : '';
    const fotoVisitante = cols[7] ? cols[7].trim() : '';

    if (!mandante && !visitante) continue;

    let dateStr = '';
    if (rawData.includes('/')) {
      const parts = rawData.split('/');
      if (parts.length === 3) {
        let p1 = parseInt(parts[0], 10);
        let p2 = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        let month = p1;
        let day = p2;
        if (p1 > 12) { day = p1; month = p2; }
        dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    } else {
      dateStr = rawData;
    }

    let timeStr = rawHora;
    if (rawHora.toLowerCase().includes('pm') || rawHora.toLowerCase().includes('am')) {
      const isPM = rawHora.toLowerCase().includes('pm');
      const clean = rawHora.replace(/(am|pm)/i, '').trim();
      const tParts = clean.split(':');
      let h = parseInt(tParts[0], 10);
      const m = tParts[1] ? tParts[1].padStart(2, '0') : '00';
      if (isPM && h < 12) h += 12;
      if (!isPM && h === 12) h = 0;
      timeStr = `${String(h).padStart(2, '0')}:${m}`;
    } else {
      const tParts = rawHora.split(':');
      if (tParts.length >= 2) {
        timeStr = `${tParts[0].padStart(2, '0')}:${tParts[1].padStart(2, '0')}`;
      }
    }

    const isHome = mandante.toLowerCase().includes('fluminense');
    const opponent = isHome ? visitante : mandante;

    result.push({
      id: `ord-${ordNum}`,
      opponent,
      date: dateStr,
      time: timeStr,
      competition: (comp as any) || 'Brasileirão',
      location: 'Maracanã',
      isHome,
      homeTeam: mandante,
      awayTeam: visitante,
      homeLogo: fotoMandante,
      awayLogo: fotoVisitante,
      tasks: []
    });
  }

  return result;
}

export async function fetchDirectGoogleSheetCSV(): Promise<Match[]> {
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!res.ok) return [];
    const text = await res.text();
    return parseGoogleSheetCSV(text);
  } catch (e) {
    console.warn('Client-side direct Google Sheet fetch warning:', e);
    return [];
  }
}

// LocalStorage helpers
export function getLocalMatches(): Match[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MATCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler localStorage:', e);
  }
  return INITIAL_MATCHES;
}

export function saveLocalMatches(matches: Match[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_MATCHES_KEY, JSON.stringify(matches));
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }
}

export async function syncFixturesFromAPI(): Promise<{ success: boolean; matches?: Match[]; message?: string; error?: string }> {
  try {
    const res = await safeFetchJson<{ success: boolean; matches?: Match[]; message?: string; error?: string }>('/api/sync/fixtures', {
      method: 'POST'
    });

    if (res.ok && res.data && res.data.matches) {
      saveLocalMatches(res.data.matches);
      return {
        success: true,
        matches: res.data.matches,
        message: res.data.message || 'Jogos do Fluminense sincronizados com sucesso!'
      };
    } else {
      return {
        success: false,
        error: res.error || 'Não foi possível sincronizar os jogos no momento.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erro ao sincronizar os jogos.'
    };
  }
}

export const DEFAULT_TELEGRAM_BOT_TOKEN = '8951861356:AAHo0fczfX2TORYkuNQT8VMcN5aRdSuhLsc';
export const DEFAULT_TELEGRAM_CHAT_ID = '640896648';

export function getLocalTelegramSettings(): TelegramSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TELEGRAM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        botToken: parsed.botToken || DEFAULT_TELEGRAM_BOT_TOKEN,
        chatId: parsed.chatId || DEFAULT_TELEGRAM_CHAT_ID
      };
    }
  } catch (e) {}
  return { botToken: DEFAULT_TELEGRAM_BOT_TOKEN, chatId: DEFAULT_TELEGRAM_CHAT_ID, enabled: true };
}

export function saveLocalTelegramSettings(settings: TelegramSettings) {
  try {
    localStorage.setItem(LOCAL_STORAGE_TELEGRAM_KEY, JSON.stringify(settings));
  } catch (e) {}
}

export function getLocalLogs(): NotificationLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveLocalLogs(logs: NotificationLog[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {}
}

export function getSyncCode(): string {
  return GLOBAL_CLOUD_BLOB_ID;
}

export function setSyncCode(_code: string) {}

// Multi-Device Cloud Sync API
export async function syncCloudData(): Promise<{ success: boolean; remoteMatches?: Match[]; remoteTelegram?: TelegramSettings; error?: string }> {
  try {
    const res = await fetch(`https://jsonblob.com/api/jsonBlob/${GLOBAL_CLOUD_BLOB_ID}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return { success: true, remoteMatches: data };
      } else if (data && typeof data === 'object') {
        return {
          success: true,
          remoteMatches: Array.isArray(data.matches) ? data.matches : [],
          remoteTelegram: data.telegramSettings
        };
      }
    }
  } catch (err) {
    console.log('Cloud sync status:', err);
  }

  return { success: false };
}

export async function pushCloudData(matchesData: Match[], telegramData?: TelegramSettings) {
  try {
    const payload: CloudPayload = {
      matches: matchesData,
      telegramSettings: telegramData || getLocalTelegramSettings(),
      updatedAt: new Date().toISOString()
    };

    await fetch(`https://jsonblob.com/api/jsonBlob/${GLOBAL_CLOUD_BLOB_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.log('Cloud push notice:', e);
  }
}

// Master multi-tier synchronization function (Server -> Google Sheet Direct -> Cloud Blob -> LocalStorage)
export async function syncFixturesAndSheet(): Promise<Match[]> {
  // 1. Try server API endpoint
  try {
    const res = await safeFetchJson<{ success?: boolean; matches?: Match[] }>('/api/sync/sheet');
    if (res.ok && res.data && Array.isArray(res.data.matches) && res.data.matches.length > 0) {
      saveLocalMatches(res.data.matches);
      return res.data.matches;
    }
  } catch (e) {}

  // 2. Direct client-side fetch from Google Sheets CSV
  const directMatches = await fetchDirectGoogleSheetCSV();
  if (directMatches.length > 0) {
    const local = getLocalMatches();
    const localMap = new Map((local || []).map(m => [m.id, m]));
    const merged = directMatches.map(m => {
      const existing = localMap.get(m.id);
      return {
        ...m,
        tasks: existing ? existing.tasks || [] : [],
        notes: existing ? existing.notes || '' : ''
      };
    });
    saveLocalMatches(merged);
    return merged;
  }

  // 3. Multi-Device cloud fallback
  const cloud = await syncCloudData();
  if (cloud.success && cloud.remoteMatches && cloud.remoteMatches.length > 0) {
    saveLocalMatches(cloud.remoteMatches);
    return cloud.remoteMatches;
  }

  // 4. Fallback to localStorage
  return getLocalMatches();
}

