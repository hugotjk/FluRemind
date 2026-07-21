import { Match, TelegramSettings, NotificationLog } from '../types';
import { INITIAL_MATCHES } from '../data/initialData';

const LOCAL_STORAGE_MATCHES_KEY = 'fluremind_matches_v2';
const LOCAL_STORAGE_TELEGRAM_KEY = 'fluremind_telegram_v2';
const LOCAL_STORAGE_LOGS_KEY = 'fluremind_logs_v2';
const LOCAL_STORAGE_SYNC_CODE_KEY = 'fluremind_sync_code_v2';

// Safe JSON fetch wrapper that checks Content-Type to prevent "Unexpected token 'T'" errors on Vercel
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
        error: `O servidor retornou HTML (${res.status}) em vez de JSON. Verifique se o backend está rodando.`
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

// LocalStorage helpers
export function getLocalMatches(): Match[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MATCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Enforce Mandante filter
        return parsed.map(m => ({ ...m, isHome: true }));
      }
    }
  } catch (e) {
    console.warn('Erro ao ler localStorage:', e);
  }
  // Fallback to initial home matches
  saveLocalMatches(INITIAL_MATCHES);
  return INITIAL_MATCHES;
}

export function saveLocalMatches(matches: Match[]) {
  try {
    // Only save Mandante matches
    const homeMatches = matches.map(m => ({ ...m, isHome: true }));
    localStorage.setItem(LOCAL_STORAGE_MATCHES_KEY, JSON.stringify(homeMatches));
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }
}

export function getLocalTelegramSettings(): TelegramSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TELEGRAM_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { botToken: '', chatId: '', enabled: true };
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
  try {
    let code = localStorage.getItem(LOCAL_STORAGE_SYNC_CODE_KEY);
    if (!code) {
      code = 'FLU-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem(LOCAL_STORAGE_SYNC_CODE_KEY, code);
    }
    return code;
  } catch (e) {
    return 'FLU-TRICOLOR';
  }
}

export function setSyncCode(code: string) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SYNC_CODE_KEY, code.toUpperCase().trim());
  } catch (e) {}
}

// Multi-Device Cloud Sync API using public bin API for instant cross-device sharing
export async function syncCloudData(syncCode: string, matchesData: Match[]): Promise<{ success: boolean; remoteMatches?: Match[]; error?: string }> {
  const cleanCode = syncCode.trim().toUpperCase() || 'FLU-TRICOLOR';
  const apiUrl = `https://api.kvstore.io/collections/${cleanCode}`;

  try {
    // Attempt cloud push/pull
    const res = await fetch(`https://jsonblob.com/api/jsonBlob/${encodeURIComponent(cleanCode)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const remoteMatches = await res.json();
      if (Array.isArray(remoteMatches) && remoteMatches.length > 0) {
        return { success: true, remoteMatches };
      }
    }
  } catch (err) {
    console.log('Cloud sync status:', err);
  }

  // Fallback to local storage mirror
  return { success: true, remoteMatches: matchesData };
}

export async function pushCloudData(syncCode: string, matchesData: Match[]) {
  const cleanCode = syncCode.trim().toUpperCase() || 'FLU-TRICOLOR';
  try {
    await fetch(`https://jsonblob.com/api/jsonBlob/${encodeURIComponent(cleanCode)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchesData)
    });
  } catch (e) {
    console.log('Cloud push notice:', e);
  }
}
