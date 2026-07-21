import { Match, TelegramSettings, NotificationLog } from '../types';
import { INITIAL_MATCHES } from '../data/initialData';

const LOCAL_STORAGE_MATCHES_KEY = 'fluremind_matches_v4';
const LOCAL_STORAGE_TELEGRAM_KEY = 'fluremind_telegram_v4';
const LOCAL_STORAGE_LOGS_KEY = 'fluremind_logs_v4';

// Single shared global storage key so ALL devices opening the link see the EXACT same matches & pre-filled tasks automatically
const GLOBAL_CLOUD_SYNC_KEY = 'FLU-MAIN-DATABASE-2026';

// Safe JSON fetch wrapper that checks Content-Type
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
        error: `O servidor retornou HTML (${res.status}) em vez de JSON.`
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
  return GLOBAL_CLOUD_SYNC_KEY;
}

export function setSyncCode(_code: string) {
  // Global sync is automatic now, no manual codes required
}

// Multi-Device Cloud Sync API using global shared JSON storage
export async function syncCloudData(_syncCode?: string, matchesData?: Match[]): Promise<{ success: boolean; remoteMatches?: Match[]; error?: string }> {
  try {
    const res = await fetch(`https://jsonblob.com/api/jsonBlob/${GLOBAL_CLOUD_SYNC_KEY}`, {
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

  // Push local state if cloud is not yet created
  if (matchesData && matchesData.length > 0) {
    pushCloudData(GLOBAL_CLOUD_SYNC_KEY, matchesData);
  }

  return { success: true, remoteMatches: matchesData };
}

export async function pushCloudData(_syncCode: string, matchesData: Match[]) {
  try {
    await fetch(`https://jsonblob.com/api/jsonBlob/${GLOBAL_CLOUD_SYNC_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchesData)
    });
  } catch (e) {
    console.log('Cloud push notice:', e);
  }
}
