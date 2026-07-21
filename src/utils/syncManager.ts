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
