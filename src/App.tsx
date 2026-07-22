import { useState, useEffect } from 'react';
import { Match, SystemStatus, TelegramSettings, NotificationLog, AutoScheduleSettings } from './types';
import { Header } from './components/Header';
import { NextMatchHero } from './components/NextMatchHero';
import { MatchCard } from './components/MatchCard';
import { CalendarView } from './components/CalendarView';
import { SettingsModal } from './components/SettingsModal';
import { MatchTasksModal } from './components/MatchTasksModal';
import { Filter, Search, Shield, RefreshCw, AlertCircle, CheckCircle2, Home } from 'lucide-react';
import {
  safeFetchJson,
  getLocalMatches,
  saveLocalMatches,
  getLocalTelegramSettings,
  saveLocalTelegramSettings,
  getLocalLogs,
  saveLocalLogs,
  syncFixturesAndSheet,
  pushCloudData,
  formatMatchTelegramMessageClient,
  sendTelegramNotificationDirect
} from './utils/syncManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<'matches' | 'past_matches' | 'calendar' | 'logs'>('matches');

  // Data State
  const [matches, setMatches] = useState<Match[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [selectedComp, setSelectedComp] = useState<string>('Todos');
  const [selectedPeriod, setSelectedPeriod] = useState<'Todos' | 'Hoje' | 'Próximos' | 'Passados'>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeTaskMatch, setActiveTaskMatch] = useState<Match | null>(null);

  // Toast Feedback State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: any, type: 'success' | 'error' | 'info' = 'success') => {
    let msgStr = 'Ocorreu um erro';
    if (typeof message === 'string') {
      msgStr = message;
    } else if (message && typeof message === 'object') {
      msgStr = message.message || message.error || JSON.stringify(message);
    }
    setToast({ type, message: msgStr });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync with Google Sheet & Cloud
  const handleSyncSheet = async () => {
    try {
      const syncedMatches = await syncFixturesAndSheet();
      if (syncedMatches && Array.isArray(syncedMatches) && syncedMatches.length > 0) {
        setMatches(syncedMatches);
        // Keep active task modal in sync if currently open
        setActiveTaskMatch(prev => {
          if (!prev) return null;
          const updated = syncedMatches.find(m => m.id === prev.id);
          return updated || prev;
        });
        return syncedMatches;
      }
    } catch (err) {
      console.warn('Erro na sincronização da planilha:', err);
    }
    const fallback = getLocalMatches();
    setMatches(fallback);
    return fallback;
  };

  // Fetch initial data on boot
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const statusRes = await safeFetchJson<SystemStatus>('/api/status');
      const configRes = await safeFetchJson<TelegramSettings>('/api/telegram/config');
      const logsRes = await safeFetchJson<NotificationLog[]>('/api/logs');

      // Sync Google Sheet immediately on load
      await handleSyncSheet();

      if (statusRes.ok && statusRes.data) {
        setStatus(statusRes.data);
      }

      if (configRes.ok && configRes.data) {
        setTelegramSettings(configRes.data);
        saveLocalTelegramSettings(configRes.data);
      } else {
        setTelegramSettings(getLocalTelegramSettings());
      }

      if (logsRes.ok && Array.isArray(logsRes.data)) {
        setLogs(logsRes.data);
        saveLocalLogs(logsRes.data);
      } else {
        setLogs(getLocalLogs());
      }
    } catch (err) {
      console.warn('Uso local:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-sync with Server & Cloud every 10 seconds for multi-device real-time sync
    const interval = setInterval(() => {
      handleSyncSheet();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Handlers for Tasks
  const handleToggleTask = async (matchId: string, taskId: string, completed: boolean) => {
    const updated = (matches || []).map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          tasks: (m.tasks || []).map(t => t.id === taskId ? { ...t, completed } : t)
        };
      }
      return m;
    });

    setMatches(updated);
    saveLocalMatches(updated);
    pushCloudData(updated, telegramSettings);

    if (activeTaskMatch && activeTaskMatch.id === matchId) {
      setActiveTaskMatch({
        ...activeTaskMatch,
        tasks: (activeTaskMatch.tasks || []).map(t => t.id === taskId ? { ...t, completed } : t)
      });
    }

    await safeFetchJson(`/api/matches/${matchId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });

    await safeFetchJson('/api/matches/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matches: updated })
    });
  };

  const handleAddTask = async (matchId: string, text: string) => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTask = {
      id: taskId,
      text,
      completed: false
    };

    const updated = (matches || []).map(m => {
      if (m.id === matchId) {
        return { ...m, tasks: [...(m.tasks || []), newTask] };
      }
      return m;
    });

    setMatches(updated);
    saveLocalMatches(updated);
    pushCloudData(updated, telegramSettings);

    if (activeTaskMatch && activeTaskMatch.id === matchId) {
      setActiveTaskMatch({
        ...activeTaskMatch,
        tasks: [...(activeTaskMatch.tasks || []), newTask]
      });
    }

    showToast('Tarefa cadastrada para este jogo! 📋');

    await safeFetchJson(`/api/matches/${matchId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, text, completed: false })
    });

    await safeFetchJson('/api/matches/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matches: updated })
    });
  };

  const handleDeleteTask = async (matchId: string, taskId: string) => {
    const updated = (matches || []).map(m => {
      if (m.id === matchId) {
        return { ...m, tasks: (m.tasks || []).filter(t => t.id !== taskId) };
      }
      return m;
    });

    setMatches(updated);
    saveLocalMatches(updated);
    pushCloudData(updated, telegramSettings);

    if (activeTaskMatch && activeTaskMatch.id === matchId) {
      setActiveTaskMatch({
        ...activeTaskMatch,
        tasks: (activeTaskMatch.tasks || []).filter(t => t.id !== taskId)
      });
    }

    await safeFetchJson(`/api/matches/${matchId}/tasks/${taskId}`, {
      method: 'DELETE'
    });

    await safeFetchJson('/api/matches/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matches: updated })
    });
  };

  // Telegram Config & Actions
  const handleSaveTelegramSettings = async (botToken: string, chatId: string, autoSchedule?: AutoScheduleSettings) => {
    const newSettings: TelegramSettings = {
      botToken,
      chatId,
      enabled: true,
      autoSchedule
    };
    saveLocalTelegramSettings(newSettings);
    setTelegramSettings(newSettings);

    await pushCloudData(matches, newSettings);

    const res = await safeFetchJson('/api/telegram/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken, chatId, enabled: true, autoSchedule })
    });

    if (res.ok) {
      showToast('Configurações e horários salvos e sincronizados com sucesso!');
    } else {
      showToast('Configurações salvas localmente!');
    }

    setStatus(prev => prev ? {
      ...prev,
      telegramConfigured: Boolean(botToken && chatId)
    } : null);
  };

  const handleTestConnection = async () => {
    try {
      const res = await safeFetchJson<{ success: boolean; message: string }>('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (res.ok) {
        showToast('Mensagem enviada com sucesso no Telegram! 🇭🇺');
        return;
      }
    } catch (e) {}

    // Direct fallback client side
    const tg = getLocalTelegramSettings();
    if (tg && tg.botToken && tg.chatId) {
      await sendTelegramNotificationDirect(
        tg.botToken,
        tg.chatId,
        '🇭🇺 *TESTE DE CONEXÃO DO FLUMINENSE* ⚽\n\nSua integração com o Telegram está funcionando perfeitamente! Saudações Tricolores!'
      );
      showToast('Mensagem enviada com sucesso no Telegram! 🇭🇺');
    } else {
      throw new Error('Configure o Bot Token e o Chat ID antes de testar.');
    }
  };

  const handleTriggerCronNow = async () => {
    try {
      const res = await safeFetchJson<{ success: boolean; message: string }>('/api/cron/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (res.ok) {
        showToast('Lembrete do próximo jogo enviado no Telegram! 🇭🇺');
        const logsRes = await safeFetchJson<NotificationLog[]>('/api/logs');
        if (logsRes.ok && Array.isArray(logsRes.data)) {
          setLogs(logsRes.data);
        }
        return;
      }
    } catch (e) {}

    // Direct fallback client side
    const tg = getLocalTelegramSettings();
    const safeList = Array.isArray(matches) ? matches : [];
    const upcoming = safeList.filter(m => m && m.date && m.date >= new Date().toISOString().split('T')[0]);
    const nextMatchItem = upcoming[0] || safeList[0];
    if (tg && tg.botToken && tg.chatId && nextMatchItem) {
      const msgText = formatMatchTelegramMessageClient(nextMatchItem);
      await sendTelegramNotificationDirect(tg.botToken, tg.chatId, msgText);
      showToast('Lembrete do próximo jogo enviado no Telegram! 🇭🇺');
    } else {
      throw new Error('Nenhum jogo ou configuração do Telegram encontrada.');
    }
  };

  const handleTestMatchTelegram = async (match: Match) => {
    try {
      const res = await safeFetchJson<{ success: boolean }>('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id })
      });

      if (res.ok) {
        showToast(`Lembrete disparado no Telegram para ${match.opponent}! 🇭🇺`);
        return;
      }
    } catch (err: any) {}

    // Direct fallback client side
    try {
      const tg = getLocalTelegramSettings();
      if (tg && tg.botToken && tg.chatId) {
        const msgText = formatMatchTelegramMessageClient(match);
        await sendTelegramNotificationDirect(tg.botToken, tg.chatId, msgText);
        showToast(`Lembrete disparado no Telegram para ${match.opponent}! 🇭🇺`);
      } else {
        showToast('Configure o Telegram nas configurações antes de enviar.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Falha ao comunicar com Telegram', 'error');
    }
  };

  const handleClearLogs = async () => {
    await safeFetchJson('/api/logs', { method: 'DELETE' });
    setLogs([]);
    saveLocalLogs([]);
    showToast('Histórico de logs limpo');
  };

  // Filter and sort matches by date (Brasília Time Zone)
  const nowBR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const todayStr = `${nowBR.getFullYear()}-${String(nowBR.getMonth() + 1).padStart(2, '0')}-${String(nowBR.getDate()).padStart(2, '0')}`;

  const safeMatchesList = Array.isArray(matches) ? matches : [];

  // Main screen constraint: ONLY HOME GAMES (isHome === true) appear on main screen
  const upcomingHomeMatches = [...safeMatchesList]
    .filter(m => m && m.isHome && m.date && m.date >= todayStr)
    .sort((a, b) => `${a.date || ''}T${a.time || '00:00'}`.localeCompare(`${b.date || ''}T${b.time || '00:00'}`));

  // Past home matches for main screen / past tab
  const pastHomeMatches = [...safeMatchesList]
    .filter(m => m && m.isHome && m.date && m.date < todayStr)
    .sort((a, b) => `${b.date || ''}T${b.time || '00:00'}`.localeCompare(`${a.date || ''}T${a.time || '00:00'}`));

  const nextMatch = upcomingHomeMatches[0] || null;

  // Active list based on selected tab
  const currentTabMatches = activeTab === 'past_matches' ? pastHomeMatches : upcomingHomeMatches;

  const filteredMatches = currentTabMatches.filter(m => {
    if (!m) return false;

    // Competition filter
    if (selectedComp !== 'Todos' && m.competition !== selectedComp) return false;

    // Period filter
    if (selectedPeriod === 'Hoje' && m.date !== todayStr) return false;
    if (selectedPeriod === 'Próximos' && m.date && m.date < todayStr) return false;
    if (selectedPeriod === 'Passados' && (!m.date || m.date >= todayStr)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.opponent || ''} ${m.competition || ''} ${m.notes || ''}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans pb-16">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Global Toast Feedback */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border ${
            toast.type === 'success' ? 'bg-[#006633] text-white border-emerald-400' :
            toast.type === 'error' ? 'bg-rose-700 text-white border-rose-400' : 'bg-stone-800 text-stone-100 border-stone-600'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#e6b800]" /> : <AlertCircle className="w-4 h-4 text-white" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* TAB 1: MAIN SCREEN (ONLY HOME MATCHES) */}
        {activeTab === 'matches' && (
          <>
            {/* Hero Banner for Next Home Match */}
            {nextMatch ? (
              <NextMatchHero match={nextMatch} />
            ) : (
              <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-6 shadow-xl border border-stone-700 text-center">
                <Shield className="w-12 h-12 text-[#e6b800] mx-auto mb-2 opacity-80" />
                <h3 className="text-lg font-bold">Nenhum próximo jogo do Fluminense em casa</h3>
                <p className="text-xs text-stone-400 mt-1">
                  Apenas os jogos em que o Fluminense é mandante aparecem na tela principal de tarefas.
                </p>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Competition Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-bold text-stone-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Filtrar:
                </span>

                <button
                  onClick={() => setSelectedComp('Todos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedComp === 'Todos' ? 'bg-[#722F37] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Todas Competições
                </button>

                {['Brasileirão', 'Copa Libertadores', 'Copa do Brasil'].map(comp => (
                  <button
                    key={comp}
                    onClick={() => setSelectedComp(selectedComp === comp ? 'Todos' : comp)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedComp === comp
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>

              {/* Period Filter & Search Input */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                >
                  <option value="Todos">📅 Todos os Períodos</option>
                  <option value="Hoje">🔥 Jogos de Hoje</option>
                  <option value="Próximos">⌛ Próximos Jogos</option>
                  <option value="Passados">🏁 Partidas Anteriores</option>
                </select>

                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Buscar adversário..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-stone-100 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                  />
                </div>
              </div>

            </div>

            {/* Matches List Grid */}
            {isLoading ? (
              <div className="py-12 text-center text-stone-500 font-medium text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#722F37]" />
                <span>Carregando jogos da planilha do Google Drive...</span>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
                <Shield className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="text-base font-bold text-stone-800">Nenhum próximo jogo em casa encontrado</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Apenas os jogos como mandante aparecem nesta tela.
                </p>
                <button
                  onClick={handleSyncSheet}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Sincronizar Planilha Agora</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMatches.map((match, idx) => (
                  <MatchCard
                    key={`${match.id}-${idx}`}
                    match={match}
                    onOpenTasks={(m) => setActiveTaskMatch(m)}
                    onToggleTask={handleToggleTask}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    onNotifyMatch={handleTestMatchTelegram}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 2: PAST HOME MATCHES */}
        {activeTab === 'past_matches' && (
          <>
            <div className="bg-gradient-to-r from-stone-800 to-stone-900 text-white rounded-2xl p-5 shadow-lg border border-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                  <span>🏁 Jogos Anteriores do Fluminense em Casa</span>
                </h2>
                <p className="text-xs text-stone-300 mt-1">
                  Histórico de partidas anteriores em que o Fluminense foi mandante.
                </p>
              </div>
              <div className="text-xs px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 font-medium">
                Total: <strong>{pastHomeMatches.length}</strong>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar no histórico..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-stone-100 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                />
              </div>
            </div>

            {/* Past Matches List */}
            {filteredMatches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-2">
                <Shield className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="text-sm font-bold text-stone-800">Nenhum jogo anterior em casa encontrado</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMatches.map((match, idx) => (
                  <MatchCard
                    key={`${match.id}-${idx}`}
                    match={match}
                    onOpenTasks={(m) => setActiveTaskMatch(m)}
                    onToggleTask={handleToggleTask}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    onNotifyMatch={handleTestMatchTelegram}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 3: ALL MATCHES CALENDAR VIEW */}
        {activeTab === 'calendar' && (
          <CalendarView
            matches={safeMatchesList}
            onOpenTasks={(m) => setActiveTaskMatch(m)}
            onNotifyMatch={handleTestMatchTelegram}
          />
        )}

      </main>

      {/* Unified Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={telegramSettings}
        status={status}
        logs={logs}
        onSaveSettings={handleSaveTelegramSettings}
        onTestConnection={handleTestConnection}
        onTriggerCronNow={handleTriggerCronNow}
        onSyncSheetNow={handleSyncSheet}
        onClearLogs={handleClearLogs}
      />

      {/* Match Checklist Modal ("Ver Tarefas") */}
      <MatchTasksModal
        match={activeTaskMatch}
        onClose={() => setActiveTaskMatch(null)}
        onToggleTask={handleToggleTask}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
      />

    </div>
  );
}
