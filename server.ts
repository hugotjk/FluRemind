import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_MATCHES } from './src/data/initialData';
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
}

function ensureDb(): DbSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DbSchema = {
      matches: INITIAL_MATCHES,
      telegramSettings: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || '',
        enabled: true
      },
      logs: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(content) as DbSchema;
    if (!data.matches || data.matches.length === 0) {
      data.matches = INITIAL_MATCHES;
    } else {
      // Force all matches to Mandante Fluminense
      data.matches = data.matches.map(m => ({ ...m, isHome: true }));
    }
    if (!data.telegramSettings) {
      data.telegramSettings = {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || '',
        enabled: true
      };
    }
    if (!data.logs) data.logs = [];
    return data;
  } catch (err) {
    console.error('Error reading db.json, falling back to initial schema:', err);
    return {
      matches: INITIAL_MATCHES,
      telegramSettings: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || '',
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

// Get effective Telegram credentials (env var priority, fallback to db settings)
function getTelegramCreds(db: DbSchema) {
  const token = process.env.TELEGRAM_BOT_TOKEN || db.telegramSettings.botToken || '';
  const chatId = process.env.TELEGRAM_CHAT_ID || db.telegramSettings.chatId || '';
  return { token, chatId };
}

// Helper to send Telegram message
async function sendTelegramNotification(token: string, chatId: string, text: string) {
  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados.');
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });

  const resData = await response.json();
  if (!response.ok || !resData.ok) {
    const errMsg = resData.description || `Erro HTTP ${response.status} ao comunicar com o Telegram`;
    throw new Error(errMsg);
  }

  return resData;
}

// Helper to format match reminder message for Telegram
function formatMatchTelegramMessage(match: Match): string {
  const homeAway = match.isHome ? '🏠 Casa (Maracanã/Rio)' : '✈️ Fora de Casa';
  const pendingTasks = match.tasks.filter(t => !t.completed);
  const doneTasks = match.tasks.filter(t => t.completed);

  let msg = `🇭🇺 *HOJE TEM FLUMINENSE!* ⚽\n\n`;
  msg += `🛡️ *Fluminense vs ${match.opponent}*\n`;
  msg += `🏆 *Competição:* ${match.competition}\n`;
  msg += `⏰ *Horário:* ${match.time}\n`;
  msg += `📍 *Local:* ${match.location} (${homeAway})\n\n`;

  if (match.notes) {
    msg += `📝 *Observação:* ${match.notes}\n\n`;
  }

  msg += `📋 *CHECKLIST DE TAREFAS (${doneTasks.length}/${match.tasks.length} concluídas):*\n`;

  if (match.tasks.length === 0) {
    msg += `_Nenhuma tarefa cadastrada para este jogo._\n`;
  } else {
    match.tasks.forEach(t => {
      const statusIcon = t.completed ? '✅' : '⏳';
      msg += `${statusIcon} ${t.text}\n`;
    });
  }

  if (pendingTasks.length > 0) {
    msg += `\n⚠️ *Atenção:* Você possui *${pendingTasks.length}* tarefa(s) pendente(s)!`;
  } else if (match.tasks.length > 0) {
    msg += `\n🎉 *Tudo pronto!* Todas as tarefas foram concluídas!`;
  }

  msg += `\n\n🔥 *VAMOS, TRICOLOR! VENCER OU VENCER!* 🇭🇺`;

  return msg;
}

async function startServer() {
  // --- API ROUTES ---

  // 1. Get system status & config
  app.get('/api/status', (req, res) => {
    const db = ensureDb();
    const { token, chatId } = getTelegramCreds(db);
    
    // Check today matches
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMatches = db.matches.filter(m => m.date === todayStr);

    res.json({
      matchesCount: db.matches.length,
      todayMatchesCount: todayMatches.length,
      telegramConfigured: Boolean(token && chatId),
      activeTokenSource: process.env.TELEGRAM_BOT_TOKEN ? 'env' : (db.telegramSettings.botToken ? 'database' : 'none'),
      activeChatIdSource: process.env.TELEGRAM_CHAT_ID ? 'env' : (db.telegramSettings.chatId ? 'database' : 'none'),
      hasEnvToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      hasEnvChatId: Boolean(process.env.TELEGRAM_CHAT_ID)
    });
  });

  // 2. Get/Set Telegram Settings
  app.get('/api/telegram/config', (req, res) => {
    const db = ensureDb();
    res.json({
      botToken: db.telegramSettings.botToken ? `${db.telegramSettings.botToken.substring(0, 6)}...` : '',
      chatId: db.telegramSettings.chatId || '',
      enabled: db.telegramSettings.enabled,
      hasEnvToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      hasEnvChatId: Boolean(process.env.TELEGRAM_CHAT_ID)
    });
  });

  app.post('/api/telegram/config', (req, res) => {
    const { botToken, chatId, enabled } = req.body;
    const db = ensureDb();

    if (botToken !== undefined) db.telegramSettings.botToken = botToken;
    if (chatId !== undefined) db.telegramSettings.chatId = chatId;
    if (enabled !== undefined) db.telegramSettings.enabled = Boolean(enabled);

    saveDb(db);
    res.json({ success: true, message: 'Configurações salvas com sucesso!' });
  });

  // 3. Test Telegram Message
  app.post('/api/telegram/test', async (req, res) => {
    try {
      const db = ensureDb();
      const { customToken, customChatId, customMessage, matchId } = req.body;

      const token = customToken || process.env.TELEGRAM_BOT_TOKEN || db.telegramSettings.botToken;
      const chatId = customChatId || process.env.TELEGRAM_CHAT_ID || db.telegramSettings.chatId;

      if (!token || !chatId) {
        return res.status(400).json({
          success: false,
          error: 'Configurações do Telegram ausentes. Por favor, preencha o Token do Bot e o Chat ID.'
        });
      }

      let messageToSend = customMessage;

      if (!messageToSend) {
        if (matchId) {
          const match = db.matches.find(m => m.id === matchId);
          if (match) {
            messageToSend = formatMatchTelegramMessage(match);
          }
        }
        
        if (!messageToSend) {
          // Default test message
          messageToSend = `🇭🇺 *TESTE DE INTEGRAÇÃO - FLUREMIND* 🇭🇺\n\n` +
            `Olá! Seu Bot do Telegram foi configurado com sucesso para enviar lembretes dos jogos do *Fluminense FC*! ⚽\n\n` +
            `📅 *Status do Sistema:* Ativo e pronto para os jogos!\n` +
            `⏰ *Vercel Cron:* Configurado para monitorar diariamente.\n\n` +
            `🔥 *Saudações Tricolores!* 🛡️`;
        }
      }

      const telegramResult = await sendTelegramNotification(token, chatId, messageToSend);

      // Log the test
      const logItem: NotificationLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: messageToSend,
        type: 'test',
        success: true,
        matchId
      };
      db.logs.unshift(logItem);
      saveDb(db);

      res.json({
        success: true,
        message: 'Notificação enviada com sucesso ao Telegram!',
        telegramResult
      });
    } catch (err: any) {
      const db = ensureDb();
      const logItem: NotificationLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: req.body.customMessage || 'Teste de notificação',
        type: 'test',
        success: false,
        error: err.message || 'Erro desconhecido'
      };
      db.logs.unshift(logItem);
      saveDb(db);

      res.status(500).json({
        success: false,
        error: err.message || 'Falha ao enviar mensagem pelo Telegram'
      });
    }
  });

  // 4. Cron Endpoint (Vercel Cron compatible / Manual Trigger)
  const handleCronReminders = async (req: express.Request, res: express.Response) => {
    try {
      const db = ensureDb();
      const { token, chatId } = getTelegramCreds(db);

      // Validate secret if CRON_SECRET is configured
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret) {
        const authHeader = req.headers.authorization;
        const cronHeader = req.headers['x-cron-secret'];
        if (authHeader !== `Bearer ${cronSecret}` && cronHeader !== cronSecret && req.query.secret !== cronSecret) {
          return res.status(401).json({ error: 'Acesso não autorizado ao Cron endpoint. Token de segurança inválido.' });
        }
      }

      if (!token || !chatId) {
        return res.status(400).json({
          success: false,
          error: 'Cron executado, mas TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não estão configurados.'
        });
      }

      // Check matches for today (local date format YYYY-MM-DD)
      const now = new Date();
      // Format as YYYY-MM-DD in America/Sao_Paulo if available or system local
      const todayStr = now.toISOString().split('T')[0];
      
      const matchesToday = db.matches.filter(m => m.date === todayStr);

      if (matchesToday.length === 0) {
        const resultMsg = `Nenhum jogo do Fluminense agendado para hoje (${todayStr}).`;
        return res.json({
          success: true,
          date: todayStr,
          matchesTodayCount: 0,
          message: resultMsg
        });
      }

      const results = [];
      for (const match of matchesToday) {
        const messageText = formatMatchTelegramMessage(match);
        const sendRes = await sendTelegramNotification(token, chatId, messageText);
        
        const logItem: NotificationLog = {
          id: `log-${Date.now()}-${match.id}`,
          timestamp: new Date().toISOString(),
          message: messageText,
          type: 'cron',
          success: true,
          matchId: match.id,
          opponent: match.opponent
        };
        db.logs.unshift(logItem);
        
        results.push({
          matchId: match.id,
          opponent: match.opponent,
          telegramResponse: sendRes
        });
      }

      saveDb(db);

      res.json({
        success: true,
        date: todayStr,
        matchesTodayCount: matchesToday.length,
        results
      });

    } catch (err: any) {
      console.error('Erro na execução do Cron:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Erro interno ao processar lembretes do Cron'
      });
    }
  };

  app.get('/api/cron/reminders', handleCronReminders);
  app.post('/api/cron/reminders', handleCronReminders);

  // 5. Matches CRUD
  app.get('/api/matches', (req, res) => {
    const db = ensureDb();
    res.json(db.matches);
  });

  app.post('/api/matches', (req, res) => {
    const db = ensureDb();
    const newMatch: Match = {
      id: `match-${Date.now()}`,
      opponent: req.body.opponent || 'Adversário',
      date: req.body.date || new Date().toISOString().split('T')[0],
      time: req.body.time || '16:00',
      competition: req.body.competition || 'Brasileirão',
      location: req.body.location || 'Maracanã, Rio de Janeiro',
      isHome: req.body.isHome !== undefined ? req.body.isHome : true,
      notes: req.body.notes || '',
      tasks: req.body.tasks || []
    };

    db.matches.unshift(newMatch);
    saveDb(db);
    res.status(201).json(newMatch);
  });

  app.put('/api/matches/:id', (req, res) => {
    const db = ensureDb();
    const index = db.matches.findIndex(m => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }

    db.matches[index] = {
      ...db.matches[index],
      ...req.body
    };

    saveDb(db);
    res.json(db.matches[index]);
  });

  app.delete('/api/matches/:id', (req, res) => {
    const db = ensureDb();
    db.matches = db.matches.filter(m => m.id !== req.params.id);
    saveDb(db);
    res.json({ success: true, id: req.params.id });
  });

  // Task management per match
  app.post('/api/matches/:id/tasks', (req, res) => {
    const db = ensureDb();
    const match = db.matches.find(m => m.id === req.params.id);
    if (!match) return res.status(404).json({ error: 'Jogo não encontrado' });

    const newTask = {
      id: `task-${Date.now()}`,
      text: req.body.text || 'Nova tarefa',
      completed: false,
      priority: req.body.priority || 'normal'
    };

    match.tasks.push(newTask);
    saveDb(db);
    res.status(201).json(newTask);
  });

  app.patch('/api/matches/:id/tasks/:taskId', (req, res) => {
    const db = ensureDb();
    const match = db.matches.find(m => m.id === req.params.id);
    if (!match) return res.status(404).json({ error: 'Jogo não encontrado' });

    const task = match.tasks.find(t => t.id === req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

    if (req.body.completed !== undefined) task.completed = req.body.completed;
    if (req.body.text !== undefined) task.text = req.body.text;

    saveDb(db);
    res.json(task);
  });

  app.delete('/api/matches/:id/tasks/:taskId', (req, res) => {
    const db = ensureDb();
    const match = db.matches.find(m => m.id === req.params.id);
    if (!match) return res.status(404).json({ error: 'Jogo não encontrado' });

    match.tasks = match.tasks.filter(t => t.id !== req.params.taskId);
    saveDb(db);
    res.json({ success: true, taskId: req.params.taskId });
  });

  // Logs Endpoint
  app.get('/api/logs', (req, res) => {
    const db = ensureDb();
    res.json(db.logs);
  });

  app.delete('/api/logs', (req, res) => {
    const db = ensureDb();
    db.logs = [];
    saveDb(db);
    res.json({ success: true });
  });

  // --- VITE MIDDLEWARE FOR DEVELOPMENT OR STATIC SERVING IN PRODUCTION ---
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
