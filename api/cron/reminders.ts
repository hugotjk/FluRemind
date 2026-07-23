import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_BOT_TOKEN = '8951861356:AAHo0fczfX2TORYkuNQT8VMcN5aRdSuhLsc';
const DEFAULT_CHAT_ID = '640896648';
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1BgoimzpqdL5UXpCw12vz4BiSuRYxIlGr/export?format=csv';
const GLOBAL_CLOUD_BLOB_ID = '019f865f-95dd-7d09-95ac-045376f38d45';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'normal' | 'high';
}

interface Match {
  id: string;
  opponent: string;
  date: string;
  time: string;
  competition: string;
  location: string;
  isHome: boolean;
  homeTeam?: string;
  awayTeam?: string;
  homeLogo?: string;
  awayLogo?: string;
  tasks: Task[];
  notes?: string;
}

interface TelegramSettings {
  botToken: string;
  chatId: string;
  enabled: boolean;
  autoSchedule?: {
    enabled: boolean;
    daysOfWeek: number[];
    notificationTimes: string[];
    onlyOnMatchDays: boolean;
  };
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
      competition: comp || 'Brasileirão',
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

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatMatchTelegramMessage(match: Match): string {
  const nowBR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
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

  const pendingTasks = (match.tasks || []).filter(t => !t.completed);
  const doneTasks = (match.tasks || []).filter(t => t.completed);

  msg += `📋 <b>CHECKLIST DE TAREFAS (${doneTasks.length}/${(match.tasks || []).length} concluídas):</b>\n`;

  if (!match.tasks || match.tasks.length === 0) {
    msg += `<i>Nenhuma tarefa cadastrada para este jogo.</i>\n`;
  } else {
    match.tasks.forEach(t => {
      const statusIcon = t.completed ? '✅' : '⏳';
      msg += `${statusIcon} ${escapeHtml(t.text)}\n`;
    });
  }

  if (pendingTasks.length > 0) {
    msg += `\n⚠️ <b>Atenção:</b> Você possui <b>${pendingTasks.length}</b> tarefa(s) pendente(s)!`;
  } else if (match.tasks && match.tasks.length > 0) {
    msg += `\n🎉 <b>Tudo pronto!</b> Todas as tarefas foram concluídas!`;
  }

  msg += `\n\n🔥 <b>VAMOS, TRICOLOR! VENCER OU VENCER!</b> 🇭🇺`;

  return msg;
}

async function sendTelegramNotification(token: string, chatId: string, text: string) {
  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados.');
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
  } catch (e) {}

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
    throw new Error(resData.description || `Erro HTTP ${response.status} ao comunicar com Telegram`);
  }

  return resData;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Fetch Cloud Data from jsonblob.com
    let telegramSettings: TelegramSettings = {
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

    let existingMatches: Match[] = [];

    try {
      const cloudRes = await fetch(`https://jsonblob.com/api/jsonBlob/${GLOBAL_CLOUD_BLOB_ID}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (cloudRes.ok) {
        const cloudData: any = await cloudRes.json();
        if (cloudData) {
          if (cloudData.telegramSettings && cloudData.telegramSettings.botToken) {
            telegramSettings = {
              ...telegramSettings,
              ...cloudData.telegramSettings
            };
          }
          if (Array.isArray(cloudData.matches) && cloudData.matches.length > 0) {
            existingMatches = cloudData.matches;
          }
        }
      }
    } catch (e) {
      console.warn('Cloud Blob fetch warning in serverless:', e);
    }

    // 2. Fetch fresh CSV from Google Sheets
    let matches: Match[] = existingMatches;
    try {
      const sheetRes = await fetch(GOOGLE_SHEET_CSV_URL);
      if (sheetRes.ok) {
        const csvText = await sheetRes.text();
        const parsed = parseGoogleSheetCSV(csvText);
        if (parsed.length > 0) {
          const taskMap = new Map<string, Task[]>();
          const notesMap = new Map<string, string>();
          existingMatches.forEach(m => {
            if (m.id) {
              if (m.tasks) taskMap.set(m.id, m.tasks);
              if (m.notes) notesMap.set(m.id, m.notes);
            }
          });

          matches = parsed.map(p => ({
            ...p,
            tasks: taskMap.get(p.id) || [],
            notes: notesMap.get(p.id) || ''
          }));
        }
      }
    } catch (e) {
      console.warn('Sheet sync warning in serverless:', e);
    }

    const token = process.env.TELEGRAM_BOT_TOKEN || telegramSettings.botToken || DEFAULT_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || telegramSettings.chatId || DEFAULT_CHAT_ID;

    if (!token || !chatId) {
      return res.status(400).json({ success: false, error: 'Configurações do Telegram ausentes.' });
    }

    const nowBR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const hour = nowBR.getHours();
    const dayOfWeek = nowBR.getDay();
    const dateStr = `${nowBR.getFullYear()}-${String(nowBR.getMonth() + 1).padStart(2, '0')}-${String(nowBR.getDate()).padStart(2, '0')}`;

    const isManual = req.query?.manual === 'true' || req.body?.manual === true || req.query?.force === 'true';

    if (!isManual) {
      const autoSchedule = telegramSettings.autoSchedule;
      if (!telegramSettings.enabled || !autoSchedule?.enabled) {
        return res.status(200).json({ success: false, message: 'Notificações automáticas estão desativadas.' });
      }

      const days = autoSchedule.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
      if (!days.includes(dayOfWeek)) {
        return res.status(200).json({ success: false, message: `Disparo ignorado pois dia da semana (${dayOfWeek}) não está ativado.` });
      }

      if (autoSchedule.onlyOnMatchDays) {
        const hasMatchToday = matches.some(m => m && m.date === dateStr);
        if (!hasMatchToday) {
          return res.status(200).json({ success: false, message: 'Disparo ignorado pois hoje não é dia de jogo.' });
        }
      }

      if (hour === 12) {
        const tomorrowObj = new Date(nowBR.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;
        const hasMatchToday = matches.some(m => m && m.date === dateStr);
        const hasMatchTomorrow = matches.some(m => m && m.date === tomorrowStr);

        if (!hasMatchToday && !hasMatchTomorrow) {
          return res.status(200).json({ success: true, message: 'Disparo das 12:00 ignorado pois hoje não é véspera nem dia de jogo.' });
        }
      }
    }

    // Find next upcoming match, prioritizing matches that have tasks
    const upcoming = [...matches]
      .filter(m => m && m.date && m.date >= dateStr)
      .sort((a, b) => `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`));

    const matchWithTasks = upcoming.find(m => Array.isArray(m.tasks) && m.tasks.length > 0);
    const targetMatch = matchWithTasks || upcoming[0] || matches[0];
    if (!targetMatch) {
      return res.status(200).json({ success: false, message: 'Nenhum próximo jogo encontrado.' });
    }

    const msgText = formatMatchTelegramMessage(targetMatch);
    const telegramResult = await sendTelegramNotification(token, chatId, msgText);

    return res.status(200).json({
      success: true,
      message: `Lembrete do próximo jogo (${targetMatch.opponent}) enviado com sucesso no Telegram!`,
      match: targetMatch.opponent,
      telegramResult
    });

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Erro ao processar Vercel Cron/Reminder' });
  }
}
