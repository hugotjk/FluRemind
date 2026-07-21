import { useState, useEffect } from 'react';
import { Match, SystemStatus, TelegramSettings, NotificationLog, AutoScheduleSettings } from './types';
import { Header } from './components/Header';
import { NextMatchHero } from './components/NextMatchHero';
import { MatchCard } from './components/MatchCard';
import { MatchModal } from './components/MatchModal';
import { TelegramSettingsModal } from './components/TelegramSettingsModal';
import { TestNotificationModal } from './components/TestNotificationModal';
import { NotificationLogViewer } from './components/NotificationLogViewer';
import { VercelExportGuide } from './components/VercelExportGuide';
import { Filter, Search, Shield, RefreshCw, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import {
  safeFetchJson,
  getLocalMatches,
  saveLocalMatches,
  getLocalTelegramSettings,
  saveLocalTelegramSettings,
  getLocalLogs,
  saveLocalLogs,
  syncCloudData,
  pushCloudData
} from './utils/syncManager';
import { INITIAL_MATCHES } from './data/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'matches' | 'logs' | 'export'>('matches');
  
  // Data State
  const [matches, setMatches] = useState<Match[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTriggeringCron, setIsTriggeringCron] = useState<boolean>(false);

  // Filters State
  const [selectedComp, setSelectedComp] = useState<string>('Todos');
  const [selectedVenue, setSelectedVenue] = useState<'Todos' | 'Casa' | 'Fora'>('Todos');
  const [selectedPeriod, setSelectedPeriod] = useState<'Todos' | 'Hoje' | 'Próximos' | 'Passados'>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [isMatchModalOpen, setIsMatchModalOpen] = useState<boolean>(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isTelegramSettingsOpen, setIsTelegramSettingsOpen] = useState<boolean>(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);

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

  // Sync state to Cloud & Local automatically
  const syncMatchesState = (newMatches: Match[]) => {
    setMatches(newMatches);
    saveLocalMatches(newMatches);
    pushCloudData('', newMatches);
  };

  // Fetch initial data safely
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const matchesRes = await safeFetchJson<Match[]>('/api/matches');
      const statusRes = await safeFetchJson<SystemStatus>('/api/status');
      const configRes = await safeFetchJson<TelegramSettings>('/api/telegram/config');
      const logsRes = await safeFetchJson<NotificationLog[]>('/api/logs');

      let currentMatches: Match[] = [];

      if (matchesRes.ok && Array.isArray(matchesRes.data) && matchesRes.data.length > 0) {
        currentMatches = matchesRes.data;
      } else {
        currentMatches = getLocalMatches();
      }

      // Check cloud database for pre-filled multi-device updates
      const cloudRes = await syncCloudData('', currentMatches);
      if (cloudRes.success && cloudRes.remoteMatches && cloudRes.remoteMatches.length > 0) {
        currentMatches = cloudRes.remoteMatches;
      }

      setMatches(currentMatches);
      saveLocalMatches(currentMatches);

      if (statusRes.ok && statusRes.data) {
        setStatus(statusRes.data);
      } else {
        const localCreds = getLocalTelegramSettings();
        setStatus({
          matchesCount: currentMatches.length,
          todayMatchesCount: currentMatches.filter(m => m.date === new Date().toISOString().split('T')[0]).length,
          telegramConfigured: Boolean(localCreds.botToken && localCreds.chatId),
          activeTokenSource: 'database',
          activeChatIdSource: 'database',
          hasEnvToken: false,
          hasEnvChatId: false
        });
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
      console.warn('Usando armazenamento local persistente:', err);
      const fallback = getLocalMatches();
      setMatches(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-poll cloud every 8 seconds so any device opening the link gets real-time task updates
    const interval = setInterval(() => {
      syncCloudData().then((res) => {
        if (res.success && res.remoteMatches && res.remoteMatches.length > 0) {
          setMatches(res.remoteMatches);
          saveLocalMatches(res.remoteMatches);
        }
      }).catch(() => {});
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Handlers for Match CRUD
  const handleSaveMatch = async (matchData: Partial<Match>) => {
    try {
      if (editingMatch) {
        const res = await safeFetchJson<Match>(`/api/matches/${editingMatch.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matchData)
        });

        const updatedMatch: Match = res.ok && res.data ? res.data : { ...editingMatch, ...matchData } as Match;
        const newMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
        syncMatchesState(newMatches);
        showToast('Jogo atualizado com sucesso! 🇭🇺');
      } else {
        const createdMatch: Match = {
          id: `match-${Date.now()}`,
          opponent: matchData.opponent || 'Adversário',
          date: matchData.date || new Date().toISOString().split('T')[0],
          time: matchData.time || '16:00',
          competition: matchData.competition || 'Brasileirão',
          location: matchData.location || 'Maracanã, Rio de Janeiro',
          isHome: matchData.isHome ?? true,
          notes: matchData.notes || '',
          tasks: [] // Inicia vazia sem sugestões
        };

        await safeFetchJson<Match>('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createdMatch)
        });

        const newMatches = [createdMatch, ...matches];
        syncMatchesState(newMatches);
        showToast('Novo jogo cadastrado e sincronizado! ⚽');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar jogo', 'error');
    }
  };

  const handleDeleteMatch = async (id: string) => {
    try {
      await safeFetchJson(`/api/matches/${id}`, { method: 'DELETE' });
      const newMatches = matches.filter(m => m.id !== id);
      syncMatchesState(newMatches);
      showToast('Jogo removido com sucesso');
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir jogo', 'error');
    }
  };

  // Handlers for Tasks
  const handleToggleTask = async (matchId: string, taskId: string, completed: boolean) => {
    const updated = matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          tasks: m.tasks.map(t => t.id === taskId ? { ...t, completed } : t)
        };
      }
      return m;
    });

    syncMatchesState(updated);

    await safeFetchJson(`/api/matches/${matchId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
  };

  const handleAddTask = async (matchId: string, text: string) => {
    const newTask = {
      id: `task-${Date.now()}`,
      text,
      completed: false
    };

    const updated = matches.map(m => {
      if (m.id === matchId) {
        return { ...m, tasks: [...m.tasks, newTask] };
      }
      return m;
    });

    syncMatchesState(updated);
    showToast('Tarefa salva e salva na nuvem! ☁️');

    await safeFetchJson(`/api/matches/${matchId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  };

  const handleDeleteTask = async (matchId: string, taskId: string) => {
    const updated = matches.map(m => {
      if (m.id === matchId) {
        return { ...m, tasks: m.tasks.filter(t => t.id !== taskId) };
      }
      return m;
    });

    syncMatchesState(updated);

    await safeFetchJson(`/api/matches/${matchId}/tasks/${taskId}`, {
      method: 'DELETE'
    });
  };

  // Client-side auto-schedule checker (runs every 30s)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!telegramSettings?.autoSchedule?.enabled) return;
      const { daysOfWeek, notificationTimes, onlyOnMatchDays } = telegramSettings.autoSchedule;

      const now = new Date();
      const currentDay = now.getDay(); // 0=Dom, 1=Seg...
      if (!daysOfWeek || !daysOfWeek.includes(currentDay)) return;

      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (!notificationTimes || !notificationTimes.includes(currentTimeStr)) return;

      // Check if already triggered this minute to avoid duplicates
      const triggerKey = `auto_sent_${now.toISOString().split('T')[0]}_${currentTimeStr}`;
      if (sessionStorage.getItem(triggerKey)) return;
      sessionStorage.setItem(triggerKey, 'true');

      // Check match requirement if enabled
      const todayStr = now.toISOString().split('T')[0];
      const hasTodayMatch = matches.some(m => m.date === todayStr);

      if (onlyOnMatchDays && !hasTodayMatch) return;

      // Fire auto reminder
      try {
        await safeFetchJson('/api/cron/reminders');
        showToast(`Lembrete automático enviado no Telegram (${currentTimeStr})! 🇭🇺`, 'info');
      } catch (err) {
        console.warn('Erro na verificação do envio automático:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [telegramSettings, matches]);

  // Telegram Config & Dispatches
  const handleSaveTelegramSettings = async (botToken: string, chatId: string, autoSchedule?: AutoScheduleSettings) => {
    const newSettings: TelegramSettings = {
      botToken,
      chatId,
      enabled: true,
      autoSchedule
    };
    saveLocalTelegramSettings(newSettings);
    setTelegramSettings(newSettings);

    const res = await safeFetchJson('/api/telegram/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken, chatId, enabled: true, autoSchedule })
    });

    if (res.ok) {
      showToast('Configurações e agendamento salvos com sucesso!');
    } else {
      showToast('Configurações salvas localmente!');
    }

    setStatus(prev => prev ? {
      ...prev,
      telegramConfigured: Boolean(botToken && chatId)
    } : {
      matchesCount: matches.length,
      todayMatchesCount: matches.filter(m => m.date === new Date().toISOString().split('T')[0]).length,
      telegramConfigured: Boolean(botToken && chatId),
      activeTokenSource: 'database',
      activeChatIdSource: 'database',
      hasEnvToken: false,
      hasEnvChatId: false
    });
  };

  const handleSendTestNotification = async (customMessage?: string, matchId?: string) => {
    const res = await safeFetchJson<{ success: boolean; message: string }>('/api/telegram/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customMessage, matchId })
    });

    if (!res.ok) {
      throw new Error(res.error || 'Não foi possível enviar mensagem. Verifique se o Bot Token e Chat ID do Telegram estão salvos.');
    }

    showToast('Mensagem enviada no Telegram com sucesso! 🇭🇺');
    return res.data;
  };

  const handleTriggerTodayCron = async () => {
    try {
      setIsTriggeringCron(true);
      const res = await safeFetchJson<{ matchesTodayCount: number; message?: string }>('/api/cron/reminders');

      if (!res.ok) {
        throw new Error(res.error || 'Falha ao rodar Cron no servidor. Se estiver na Vercel, use a Vercel Cron.');
      }

      if (res.data && res.data.matchesTodayCount === 0) {
        showToast('Nenhum jogo do Fluminense agendado para hoje', 'info');
      } else {
        showToast(`Lembrete disparado para o jogo de hoje! 🇭🇺`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao rodar Cron', 'error');
    } finally {
      setIsTriggeringCron(false);
    }
  };

  const handleClearLogs = async () => {
    await safeFetchJson('/api/logs', { method: 'DELETE' });
    setLogs([]);
    saveLocalLogs([]);
    showToast('Histórico limpo');
  };

  // Find next upcoming match
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingMatches = [...matches]
    .filter(m => m.date >= todayStr)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  
  const nextMatch = upcomingMatches[0] || matches[0] || null;

  // Filter and sort matches by date
  const filteredMatches = matches
    .filter(m => {
      // Venue filter
      if (selectedVenue === 'Casa' && !m.isHome) return false;
      if (selectedVenue === 'Fora' && m.isHome) return false;

      // Competition filter
      if (selectedComp !== 'Todos' && m.competition !== selectedComp) return false;

      // Period filter
      if (selectedPeriod === 'Hoje' && m.date !== todayStr) return false;
      if (selectedPeriod === 'Próximos' && m.date < todayStr) return false;
      if (selectedPeriod === 'Passados' && m.date >= todayStr) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = `${m.opponent} ${m.competition} ${m.location} ${m.notes || ''}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }

      return true;
    })
    .sort((a, b) => `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`));

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans pb-16">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        onOpenTelegramSettings={() => setIsTelegramSettingsOpen(true)}
        onOpenTestNotification={() => setIsTestModalOpen(true)}
        onOpenAddMatch={() => {
          setEditingMatch(null);
          setIsMatchModalOpen(true);
        }}
        onTriggerCronToday={handleTriggerTodayCron}
        isTriggeringCron={isTriggeringCron}
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
        
        {activeTab === 'matches' && (
          <>
            {/* Hero Banner for Next Match */}
            {nextMatch && (
              <NextMatchHero
                match={nextMatch}
                onOpenChecklist={(m) => {
                  setEditingMatch(m);
                  setIsMatchModalOpen(true);
                }}
                onTestTelegramMatch={(m) => {
                  handleSendTestNotification(undefined, m.id)
                    .then(() => showToast(`Notificação enviada para o jogo contra o ${m.opponent}! 🇭🇺`))
                    .catch((err) => showToast(err.message, 'error'));
                }}
              />
            )}

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Competition & Venue Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-bold text-stone-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Filtrar:
                </span>

                <button
                  onClick={() => setSelectedVenue('Todos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedVenue === 'Todos' ? 'bg-[#722F37] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Todos os Jogos
                </button>
                <button
                  onClick={() => setSelectedVenue('Casa')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedVenue === 'Casa' ? 'bg-[#006633] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  🏠 Casa
                </button>
                <button
                  onClick={() => setSelectedVenue('Fora')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedVenue === 'Fora' ? 'bg-[#722F37] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  ✈️ Fora
                </button>

                {['Brasileirão', 'Copa Libertadores', 'Copa do Brasil'].map(comp => (
                  <button
                    key={comp}
                    onClick={() => setSelectedComp(selectedComp === comp ? 'Todos' : comp)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedComp === comp
                        ? 'bg-amber-600 text-white shadow-sm'
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
                <span>Carregando jogos e tarefas do Fluminense...</span>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
                <Shield className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="text-base font-bold text-stone-800">Nenhum jogo cadastrado nesse filtro</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Cadastre os jogos manualmente com as datas, horários e suas tarefas personalizadas. Tudo fica salvo automaticamente para todos os aparelhos!
                </p>
                <button
                  onClick={() => {
                    setEditingMatch(null);
                    setIsMatchModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-[#722F37] hover:bg-[#5a0c1a] text-white text-xs font-bold rounded-xl shadow-lg transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Novo Jogo Manualmente</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onEdit={(m) => {
                      setEditingMatch(m);
                      setIsMatchModalOpen(true);
                    }}
                    onDelete={handleDeleteMatch}
                    onToggleTask={handleToggleTask}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    onNotifyMatch={(m) => {
                      handleSendTestNotification(undefined, m.id)
                        .then(() => showToast(`Lembrete disparado no Telegram para ${m.opponent}! 🇭🇺`))
                        .catch((err) => showToast(err.message, 'error'));
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab 2: Logs */}
        {activeTab === 'logs' && (
          <NotificationLogViewer
            logs={logs}
            onClearLogs={handleClearLogs}
          />
        )}

        {/* Tab 3: Export Guide */}
        {activeTab === 'export' && (
          <VercelExportGuide />
        )}

      </main>

      {/* Modals */}
      <MatchModal
        isOpen={isMatchModalOpen}
        onClose={() => {
          setIsMatchModalOpen(false);
          setEditingMatch(null);
        }}
        onSave={handleSaveMatch}
        initialData={editingMatch}
      />

      <TelegramSettingsModal
        isOpen={isTelegramSettingsOpen}
        onClose={() => setIsTelegramSettingsOpen(false)}
        settings={telegramSettings}
        onSaveSettings={handleSaveTelegramSettings}
        onTestConnection={async () => {
          await handleSendTestNotification();
        }}
      />

      <TestNotificationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        matches={matches}
        onSendCustomNotification={async (text, matchId) => {
          return await handleSendTestNotification(text, matchId);
        }}
      />

    </div>
  );
}
