import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Match, TelegramSettings, NotificationLog } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Database file storage
const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DbSchema {
  matches: Match[];
  telegramSettings: TelegramSettings;
  logs: NotificationLog[];
  lastSyncedAt?: string;
}

const DEFAULT_BOT_TOKEN = '8951861356:AAHo0fczfX2TORYkuNQT8VMcN5aRdSuhLsc';
const DEFAULT_CHAT_ID = '640896648';
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1BgoimzpqdL5UXpCw12vz4BiSuRYxIlGr/export?format=csv';
const GLOBAL_CLOUD_BLOB_ID = '019f865f-95dd-7d09-95ac-045376f38d45';

async function pushCloudDataServer(matchesData: Match[], telegramData?: TelegramSettings) {
  try {
    const payload = {
      matches: matchesData,
      telegramSettings: telegramData,
      updatedAt: new Date().toISOString()
    };
    await fetch(`https://jsonblob.com/api/jsonBlob/${GLOBAL_CLOUD_BLOB_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn('Server Cloud Blob push notice:', e);
  }
}

function ensureDb(): DbSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DbSchema = {
      matches: [],
      telegramSettings: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID,
        enabled: true,
        autoSchedule: {
          enabled: true,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          notificationTimes: ['08:00', '12:00', '18:00'],
          onlyOnMatchDays: false
        }
      },
      logs: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(content) as DbSchema;
    if (!data.matches) data.matches = [];
    if (!data.telegramSettings || !data.telegramSettings.botToken) {
      data.telegramSettings = {
        botToken: process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID,
        enabled: true,
        autoSchedule: {
          enabled: true,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          notificationTimes: ['08:00', '12:00', '18:00'],
          onlyOnMatchDays: false
        }
      };
      saveDb(data);
    }
    if (!data.logs) data.logs = [];
    if (data.telegramSettings?.autoSchedule?.notificationTimes) {
      data.telegramSettings.autoSchedule.notificationTimes = data.telegramSettings.autoSchedule.notificationTimes
        .filter(t => t !== '11:20');
      if (data.telegramSettings.autoSchedule.notificationTimes.length === 0) {
        data.telegramSettings.autoSchedule.notificationTimes = ['08:00', '12:00', '18:00'];
      }
    }
    return data;
  } catch (err) {
    console.error('Error reading db.json, falling back:', err);
    return {
      matches: [],
      telegramSettings: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID,
        enabled: true
      },
      logs: []
    };
  }
}

function saveDb(data: DbSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db.json:', err);
  }
}

function getTelegramCreds(db: DbSchema) {
  const token = process.env.TELEGRAM_BOT_TOKEN || db.telegramSettings?.botToken || DEFAULT_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || db.telegramSettings?.chatId || DEFAULT_CHAT_ID;
  return { token, chatId };
}

async function sendTelegramNotification(token: string, chatId: string, text: string) {
  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não estão configurados.');
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });

    const resData = await response.json();
    if (response.ok && resData.ok) {
      return resData;
    }
  } catch (e) {
    console.warn('HTML parse failed, attempting plain text fallback:', e);
  }

  const plainText = text.replace(/<[^>]*>/g, '');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: plainText
    })
  });

  const resData = await response.json();
  if (!response.ok || !resData.ok) {
    const errMsg = resData.description || `Erro HTTP ${response.status} ao comunicar com o Telegram`;
    throw new Error(errMsg);
  }

  return resData;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Format smart notification message for Telegram (calculates days until next match)
function formatMatchTelegramMessage(match: Match): string {
  const nowBR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const todayStr = `${nowBR.getFullYear()}-${String(nowBR.getMonth() + 1).padStart(2, '0')}-${String(nowBR.getDate()).padStart(2, '0')}`;

  const dateParts = (match.date || '').split('-');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);
  const day = parseInt(dateParts[2], 10);

  const formattedDate = (day && month && year) ? `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}` : match.date;

  const matchDateObj = new Date(year, month - 1, day);
  const todayDateObj = new Date(nowBR.getFullYear(), nowBR.getMonth(), nowBR.getDate());
  const diffTime = matchDateObj.getTime() - todayDateObj.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  let headerTitle = '';
  if (diffDays === 0) {
    headerTitle = `🚨 <b>HOJE TEM FLUMINENSE!</b> ⚽`;
  } else if (diffDays === 1) {
    headerTitle = `⏳ <b>AMANHÃ TEM FLUMINENSE!</b> ⚽`;
  } else if (diffDays > 1) {
    headerTitle = `📅 <b>PRÓXIMO JOGO DO FLUMINENSE (em ${diffDays} dias - ${formattedDate})</b> ⚽`;
  } else {
    headerTitle = `🏁 <b>PARTIDA DO FLUMINENSE (${formattedDate})</b> ⚽`;
  }

  const homeTeam = match.homeTeam || (match.isHome ? 'Fluminense' : match.opponent);
  const awayTeam = match.awayTeam || (match.isHome ? match.opponent : 'Fluminense');

  let msg = `🇭🇺 ${headerTitle}\n\n`;
  msg += `🛡️ <b>${escapeHtml(homeTeam)} vs ${escapeHtml(awayTeam)}</b>\n`;
  msg += `🏆 <b>Competição:</b> ${escapeHtml(match.competition)}\n`;
  msg += `⏰ <b>Horário:</b> ${escapeHtml(match.time)} hrs (${formattedDate})\n\n`;

  if (match.notes) {
    msg += `📝 <b>Observação:</b> ${escapeHtml(match.notes)}\n\n`;
  }

  const pendingTasks = match.tasks.filter(t => !t.completed);
  const doneTasks = match.tasks.filter(t => t.completed);

  msg += `📋 <b>CHECKLIST DE TAREFAS (${doneTasks.length}/${match.tasks.length} concluídas):</b>\n`;

  if (match.tasks.length === 0) {
    msg += `<i>Nenhuma tarefa cadastrada para este jogo.</i>\n`;
  } else {
    match.tasks.forEach(t => {
      const statusIcon = t.completed ? '✅' : '⏳';
      msg += `${statusIcon} ${escapeHtml(t.text)}\n`;
    });
  }

  if (pendingTasks.length > 0) {
    msg += `\n⚠️ <b>Atenção:</b> Você possui <b>${pendingTasks.length}</b> tarefa(s) pendente(s)!`;
  } else if (match.tasks.length > 0) {
    msg += `\n🎉 <b>Tudo pronto!</b> Todas as tarefas foram concluídas!`;
  }

  msg += `\n\n🔥 <b>VAMOS, TRICOLOR! VENCER OU VENCER!</b> 🇭🇺`;

  return msg;
}

function parseCsvLine(text: string): string[] {
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

// Parse CSV from Google Sheet
function parseGoogleSheetCSV(text: string): Match[] {
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

    // Date parse: M/D/YYYY or D/M/YYYY or YYYY-MM-DD
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

    // Time parse: 4:30:00 PM or 16:30:00 -> 16:30
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

// Fetch Google Sheet & merge into db.matches preserving user tasks per Ord
async function syncGoogleSheetData(db: DbSchema): Promise<Match[]> {
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status} ao acessar planilha do Google Drive`);
    }

    const csvText = await res.text();
    const parsedMatches = parseGoogleSheetCSV(csvText);

    if (parsedMatches.length === 0) {
      console.warn('Google Sheet returned 0 parsed matches, keeping existing matches.');
      return db.matches;
    }

    // Try fetching existing tasks from Cloud Blob as well to ensure cross-device consistency
    const cloudTasksMap = new Map<string, any[]>();
    const cloudNotesMap = new Map<string, string>();
    try {
      const cloudRes = await fetch(`https://jsonblob.com/api/jsonBlob/${GLOBAL_CLOUD_BLOB_ID}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (cloudRes.ok) {
        const cloudData = await cloudRes.json();
        const cloudMatches = Array.isArray(cloudData) ? cloudData : (cloudData?.matches || []);
        cloudMatches.forEach((m: any) => {
          if (m && m.id) {
            if (Array.isArray(m.tasks) && m.tasks.length > 0) {
              cloudTasksMap.set(m.id, m.tasks);
            }
            if (m.notes) {
              cloudNotesMap.set(m.id, m.notes);
            }
          }
        });
      }
    } catch (e) {}

    const existingMap = new Map<string, Match>();
    (db.matches || []).forEach(m => {
      if (m && m.id) existingMap.set(m.id, m);
    });

    const updatedMatches: Match[] = parsedMatches.map(inc => {
      const existing = existingMap.get(inc.id);
      const existingTasks = existing ? existing.tasks || [] : [];
      const cloudTasks = cloudTasksMap.get(inc.id) || [];

      // Merge tasks uniquely by task id
      const taskMap = new Map<string, any>();
      existingTasks.forEach(t => { if (t && t.id) taskMap.set(t.id, t); });
      cloudTasks.forEach(t => {
        if (t && t.id) {
          if (taskMap.has(t.id)) {
            const prev = taskMap.get(t.id);
            taskMap.set(t.id, { ...prev, ...t, completed: Boolean(prev.completed || t.completed) });
          } else {
            taskMap.set(t.id, t);
          }
        }
      });

      return {
        ...inc,
        tasks: Array.from(taskMap.values()),
        notes: existing?.notes || cloudNotesMap.get(inc.id) || ''
      };
    });

    db.matches = updatedMatches;
    db.lastSyncedAt = new Date().toISOString();
    saveDb(db);
    pushCloudDataServer(db.matches, db.telegramSettings);
    return updatedMatches;

  } catch (err: any) {
    console.error('Failed to sync Google Sheet:', err.message);
    return db.matches;
  }
}

// Send next match reminder to Telegram
async function triggerNextMatchReminder(db: DbSchema): Promise<{ success: boolean; message: string; result?: any }> {
  const { token, chatId } = getTelegramCreds(db);
  if (!token || !chatId) {
    throw new Error('Configurações do Telegram ausentes.');
  }

  const nowBR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const todayStr = `${nowBR.getFullYear()}-${String(nowBR.getMonth() + 1).padStart(2, '0')}-${String(nowBR.getDate()).padStart(2, '0')}`;

  // Find next upcoming match (date >= todayStr)
  const upcoming = [...db.matches]
    .filter(m => m && m.date && m.date >= todayStr)
    .sort((a, b) => `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`));

  const nextMatch = upcoming[0] || db.matches[0];
  if (!nextMatch) {
    return { success: false, message: 'Nenhum próximo jogo encontrado para enviar notificação.' };
  }

  const msgText = formatMatchTelegramMessage(nextMatch);
  const sendRes = await sendTelegramNotification(token, chatId, msgText);

  const logItem: NotificationLog = {
    id: `log-${Date.now()}-${nextMatch.id}`,
    timestamp: new Date().toISOString(),
    message: msgText,
    type: 'cron',
    success: true,
    matchId: nextMatch.id,
    opponent: nextMatch.opponent
  };
  db.logs.unshift(logItem);
  saveDb(db);

  return { success: true, message: `Lembrete do próximo jogo (${nextMatch.opponent}) enviado com sucesso!`, result: sendRes };
}

// Background Cron Scheduler (Brasília UTC-3)
let lastSheetSyncKey = '';
let lastTelegramKey = '';

function startBackgroundCronScheduler() {
  setInterval(async () => {
    try {
      const nowBR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      const hour = nowBR.getHours();
      const minute = nowBR.getMinutes();
      const dayOfWeek = nowBR.getDay(); // 0 = Dom, 1 = Seg, ... 6 = Sáb
      const dateStr = `${nowBR.getFullYear()}-${String(nowBR.getMonth() + 1).padStart(2, '0')}-${String(nowBR.getDate()).padStart(2, '0')}`;
      const timeHHMM = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      const db = ensureDb();

      // Pull cloud telegram settings so changes made on Vercel/mobile are recognized by server
      try {
        const cloudRes = await fetch(`https://jsonblob.com/api/jsonBlob/${GLOBAL_CLOUD_BLOB_ID}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (cloudRes.ok) {
          const cloudData: any = await cloudRes.json();
          if (cloudData) {
            let dbUpdated = false;
            if (cloudData.telegramSettings && cloudData.telegramSettings.botToken) {
              const currentTimes = db.telegramSettings?.autoSchedule?.notificationTimes || [];
              const cloudTimes = cloudData.telegramSettings?.autoSchedule?.notificationTimes || [];
              const mergedTimes = Array.from(new Set([...currentTimes, ...cloudTimes]))
                .filter(t => t !== '11:20')
                .sort();

              db.telegramSettings = {
                ...db.telegramSettings,
                ...cloudData.telegramSettings,
                autoSchedule: {
                  enabled: cloudData.telegramSettings.autoSchedule?.enabled ?? db.telegramSettings?.autoSchedule?.enabled ?? true,
                  daysOfWeek: cloudData.telegramSettings.autoSchedule?.daysOfWeek || db.telegramSettings?.autoSchedule?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
                  notificationTimes: mergedTimes.length > 0 ? mergedTimes : ['08:00', '12:00', '18:00'],
                  onlyOnMatchDays: cloudData.telegramSettings.autoSchedule?.onlyOnMatchDays ?? db.telegramSettings?.autoSchedule?.onlyOnMatchDays ?? false
                }
              };
              dbUpdated = true;
            }
            if (Array.isArray(cloudData.matches) && cloudData.matches.length > 0) {
              const cloudTaskMap = new Map<string, any[]>();
              cloudData.matches.forEach((m: any) => { if (m && m.id && Array.isArray(m.tasks)) cloudTaskMap.set(m.id, m.tasks); });
              (db.matches || []).forEach(m => {
                if (m && m.id && cloudTaskMap.has(m.id)) {
                  m.tasks = cloudTaskMap.get(m.id)!;
                }
              });
              dbUpdated = true;
            }
            if (dbUpdated) saveDb(db);
          }
        }
      } catch (e) {}

      // 1. Sincronização automática com a planilha base todos os dias às 08:00, 12:00 e 18:00 (BRT)
      if ((hour === 8 || hour === 12 || hour === 18) && minute === 0) {
        const syncKey = `${dateStr}_${hour}`;
        if (lastSheetSyncKey !== syncKey) {
          lastSheetSyncKey = syncKey;
          console.log(`[SHEET AUTO-SYNC BRT] Executando sincronização com a planilha às ${hour}h00 em ${dateStr}...`);
          await syncGoogleSheetData(db);
        }
      }

      // 2. Envio de notificações no Telegram com base nas configurações personalizadas do usuário
      const autoSchedule = db.telegramSettings?.autoSchedule;
      if (db.telegramSettings?.enabled && autoSchedule?.enabled) {
        const days = autoSchedule.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
        const rawTimes = autoSchedule.notificationTimes || ['08:00', '12:00', '18:00'];
        const notifTimes = rawTimes.filter(t => t !== '11:20');

        if (days.includes(dayOfWeek) && notifTimes.includes(timeHHMM)) {
          // Special rule for 12:00: only send on match day OR match eve (véspera do jogo)
          if (timeHHMM === '12:00') {
            const tomorrowObj = new Date(nowBR.getTime() + 24 * 60 * 60 * 1000);
            const tomorrowStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;
            const hasMatchToday = (db.matches || []).some(m => m && m.date === dateStr);
            const hasMatchTomorrow = (db.matches || []).some(m => m && m.date === tomorrowStr);

            if (!hasMatchToday && !hasMatchTomorrow) {
              console.log(`[TELEGRAM AUTO-NOTIFY BRT] Ignorando disparo das 12:00 (Hoje ${dateStr} não é dia de jogo nem véspera).`);
              return;
            }
          }

          if (autoSchedule.onlyOnMatchDays) {
            const hasMatchToday = (db.matches || []).some(m => m && m.date === dateStr);
            if (!hasMatchToday) return;
          }

          const tgKey = `${dateStr}_${timeHHMM}`;
          if (lastTelegramKey !== tgKey) {
            lastTelegramKey = tgKey;
            console.log(`[TELEGRAM AUTO-NOTIFY BRT] Disparando mensagem do Telegram às ${timeHHMM} BRT em ${dateStr}...`);
            await triggerNextMatchReminder(db);
          }
        }
      }

    } catch (e) {
      console.error('[AUTO-CRON BRT Error]:', e);
    }
  }, 30000); // Check every 30 seconds
}

async function startServer() {
  const db = ensureDb();
  // Perform initial Google Sheet sync on server boot
  await syncGoogleSheetData(db);
  startBackgroundCronScheduler();

  // --- API ROUTES ---

  app.get('/api/status', (req, res) => {
    const currentDb = ensureDb();
    const { token, chatId } = getTelegramCreds(currentDb);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMatches = currentDb.matches.filter(m => m.date === todayStr);

    res.json({
      matchesCount: currentDb.matches.length,
      todayMatchesCount: todayMatches.length,
      telegramConfigured: Boolean(token && chatId),
      activeTokenSource: process.env.TELEGRAM_BOT_TOKEN ? 'env' : (currentDb.telegramSettings.botToken ? 'database' : 'none'),
      activeChatIdSource: process.env.TELEGRAM_CHAT_ID ? 'env' : (currentDb.telegramSettings.chatId ? 'database' : 'none'),
      lastSyncedAt: currentDb.lastSyncedAt || null
    });
  });

  app.get('/telegram', (req, res) => {
    res.redirect('/');
  });

  app.get('/api/telegram/config', (req, res) => {
    const currentDb = ensureDb();
    res.json({
      botToken: currentDb.telegramSettings.botToken || DEFAULT_BOT_TOKEN,
      chatId: currentDb.telegramSettings.chatId || DEFAULT_CHAT_ID,
      enabled: currentDb.telegramSettings.enabled ?? true,
      autoSchedule: currentDb.telegramSettings.autoSchedule || {
        enabled: true,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        notificationTimes: ['08:00', '12:00', '18:00'],
        onlyOnMatchDays: false
      },
      hasEnvToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      hasEnvChatId: Boolean(process.env.TELEGRAM_CHAT_ID)
    });
  });

  app.post('/api/telegram/config', (req, res) => {
    const { botToken, chatId, enabled, autoSchedule } = req.body;
    const currentDb = ensureDb();

    if (botToken !== undefined && botToken.trim() !== '') currentDb.telegramSettings.botToken = botToken.trim();
    if (chatId !== undefined && chatId.trim() !== '') currentDb.telegramSettings.chatId = chatId.trim();
    if (enabled !== undefined) currentDb.telegramSettings.enabled = Boolean(enabled);
    if (autoSchedule !== undefined) currentDb.telegramSettings.autoSchedule = autoSchedule;

    saveDb(currentDb);
    pushCloudDataServer(currentDb.matches, currentDb.telegramSettings);
    res.json({ success: true, message: 'Configurações salvas e sincronizadas na nuvem!' });
  });

  app.post('/api/telegram/test', async (req, res) => {
    try {
      const currentDb = ensureDb();
      const { customToken, customChatId, matchId } = req.body;

      const token = customToken || process.env.TELEGRAM_BOT_TOKEN || currentDb.telegramSettings.botToken;
      const chatId = customChatId || process.env.TELEGRAM_CHAT_ID || currentDb.telegramSettings.chatId;

      if (!token || !chatId) {
        return res.status(400).json({ success: false, error: 'Configurações do Telegram ausentes.' });
      }

      let messageToSend = '';
      if (matchId) {
        const match = currentDb.matches.find(m => m.id === matchId);
        if (match) messageToSend = formatMatchTelegramMessage(match);
      }

      if (!messageToSend) {
        // Default message to next match
        const nowBR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const todayStr = `${nowBR.getFullYear()}-${String(nowBR.getMonth() + 1).padStart(2, '0')}-${String(nowBR.getDate()).padStart(2, '0')}`;
        const upcoming = [...currentDb.matches]
          .filter(m => m && m.date && m.date >= todayStr)
          .sort((a, b) => `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`));

        const targetMatch = upcoming[0] || currentDb.matches[0];
        if (targetMatch) {
          messageToSend = formatMatchTelegramMessage(targetMatch);
        } else {
          messageToSend = `🇭🇺 <b>TESTE DE INTEGRAÇÃO - FLUREMIND</b> 🇭🇺\n\n` +
            `Olá! Seu Bot do Telegram foi configurado com sucesso para enviar lembretes do <b>Fluminense FC</b>! ⚽\n\n` +
            `🔥 <b>SAUDAÇÕES TRICOLORES!</b> 🇭🇺`;
        }
      }

      const telegramResult = await sendTelegramNotification(token, chatId, messageToSend);

      const logItem: NotificationLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: messageToSend,
        type: 'test',
        success: true,
        matchId
      };
      currentDb.logs.unshift(logItem);
      saveDb(currentDb);

      res.json({ success: true, message: 'Notificação enviada no Telegram!', telegramResult });
    } catch (err: any) {
      const currentDb = ensureDb();
      const logItem: NotificationLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: 'Teste de notificação',
        type: 'test',
        success: false,
        error: err.message || 'Erro desconhecido'
      };
      currentDb.logs.unshift(logItem);
      saveDb(currentDb);

      res.status(500).json({ success: false, error: err.message || 'Falha ao enviar mensagem' });
    }
  });

  // Manual / Cron Trigger for Next Match Reminder
  const handleCronReminders = async (req: express.Request, res: express.Response) => {
    try {
      const currentDb = ensureDb();
      const nowBR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      const hour = nowBR.getHours();
      const isManual = req.query.manual === 'true' || req.body?.manual === true;

      if (!isManual && hour === 12) {
        const dateStr = `${nowBR.getFullYear()}-${String(nowBR.getMonth() + 1).padStart(2, '0')}-${String(nowBR.getDate()).padStart(2, '0')}`;
        const tomorrowObj = new Date(nowBR.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;
        const hasMatchToday = (currentDb.matches || []).some(m => m && m.date === dateStr);
        const hasMatchTomorrow = (currentDb.matches || []).some(m => m && m.date === tomorrowStr);

        if (!hasMatchToday && !hasMatchTomorrow) {
          return res.json({ success: true, message: 'Disparo das 12:00 ignorado pois hoje não é véspera nem dia de jogo.' });
        }
      }

      const result = await triggerNextMatchReminder(currentDb);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Erro ao disparar lembretes' });
    }
  };

  app.get('/api/cron/reminders', handleCronReminders);
  app.post('/api/cron/reminders', handleCronReminders);

  // Sync Google Sheet API
  const handleSheetSync = async (req: express.Request, res: express.Response) => {
    try {
      const currentDb = ensureDb();
      const updatedMatches = await syncGoogleSheetData(currentDb);
      res.json({
        success: true,
        message: 'Jogos sincronizados com a planilha do Google Drive!',
        matches: updatedMatches,
        lastSyncedAt: currentDb.lastSyncedAt
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Falha ao sincronizar planilha' });
    }
  };

  app.get('/api/sync/sheet', handleSheetSync);
  app.post('/api/sync/sheet', handleSheetSync);
  app.get('/api/sync/fixtures', handleSheetSync);
  app.post('/api/sync/fixtures', handleSheetSync);

  // Matches List
  app.get('/api/matches', (req, res) => {
    const currentDb = ensureDb();
    res.json(currentDb.matches);
  });

  // Tasks Management per Match
  app.post('/api/matches/:id/tasks', (req, res) => {
    const currentDb = ensureDb();
    const match = currentDb.matches.find(m => m.id === req.params.id);
    if (!match) return res.status(404).json({ error: 'Jogo não encontrado' });

    const newTask = {
      id: req.body.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: req.body.text || 'Nova tarefa',
      completed: Boolean(req.body.completed),
      priority: req.body.priority || 'normal'
    };

    if (!match.tasks) match.tasks = [];
    // Avoid duplicate tasks if id supplied
    if (!match.tasks.some(t => t.id === newTask.id)) {
      match.tasks.push(newTask);
    }
    saveDb(currentDb);
    pushCloudDataServer(currentDb.matches, currentDb.telegramSettings);
    res.status(201).json(newTask);
  });

  app.patch('/api/matches/:id/tasks/:taskId', (req, res) => {
    const currentDb = ensureDb();
    const match = currentDb.matches.find(m => m.id === req.params.id);
    if (!match) return res.status(404).json({ error: 'Jogo não encontrado' });

    const task = (match.tasks || []).find(t => t.id === req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

    if (req.body.completed !== undefined) task.completed = req.body.completed;
    if (req.body.text !== undefined) task.text = req.body.text;

    saveDb(currentDb);
    pushCloudDataServer(currentDb.matches, currentDb.telegramSettings);
    res.json(task);
  });

  app.delete('/api/matches/:id/tasks/:taskId', (req, res) => {
    const currentDb = ensureDb();
    const match = currentDb.matches.find(m => m.id === req.params.id);
    if (!match) return res.status(404).json({ error: 'Jogo não encontrado' });

    match.tasks = (match.tasks || []).filter(t => t.id !== req.params.taskId);
    saveDb(currentDb);
    pushCloudDataServer(currentDb.matches, currentDb.telegramSettings);
    res.json({ success: true, taskId: req.params.taskId });
  });

  // Direct sync of all matches & tasks from any client device
  app.post('/api/matches/sync', (req, res) => {
    const clientMatches = req.body.matches;
    if (!Array.isArray(clientMatches)) {
      return res.status(400).json({ error: 'Invalid payload, expected matches array' });
    }

    const currentDb = ensureDb();
    const dbMap = new Map<string, Match>();
    (currentDb.matches || []).forEach(m => { if (m && m.id) dbMap.set(m.id, m); });

    // Update tasks and notes for provided client matches
    clientMatches.forEach((cm: Match) => {
      if (!cm || !cm.id) return;
      const dbMatch = dbMap.get(cm.id);
      if (dbMatch) {
        if (Array.isArray(cm.tasks)) {
          dbMatch.tasks = cm.tasks;
        }
        if (cm.notes !== undefined) {
          dbMatch.notes = cm.notes;
        }
      }
    });

    saveDb(currentDb);
    pushCloudDataServer(currentDb.matches, currentDb.telegramSettings);
    res.json({ success: true, matches: currentDb.matches });
  });

  // Logs
  app.get('/api/logs', (req, res) => {
    const currentDb = ensureDb();
    res.json(currentDb.logs);
  });

  app.delete('/api/logs', (req, res) => {
    const currentDb = ensureDb();
    currentDb.logs = [];
    saveDb(currentDb);
    res.json({ success: true });
  });

  // --- VITE MIDDLEWARE FOR DEVELOPMENT OR STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FluRemind Server running on http://localhost:${PORT}`);
    const initialDb = ensureDb();
    syncGoogleSheetData(initialDb).then(() => {
      console.log(`[BOOT] Planilha do Google Drive sincronizada no boot (${initialDb.matches.length} jogos).`);
    }).catch(err => {
      console.warn('[BOOT Sync Error]:', err);
    });
  });
}

startServer();
