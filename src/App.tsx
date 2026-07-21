import React, { useState, useEffect } from 'react';
import { Match, Competition, SystemStatus, TelegramSettings, NotificationLog } from './types';
import { Header } from './components/Header';
import { NextMatchHero } from './components/NextMatchHero';
import { MatchCard } from './components/MatchCard';
import { MatchModal } from './components/MatchModal';
import { TelegramSettingsModal } from './components/TelegramSettingsModal';
import { TestNotificationModal } from './components/TestNotificationModal';
import { NotificationLogViewer } from './components/NotificationLogViewer';
import { VercelExportGuide } from './components/VercelExportGuide';
import { Calendar, Filter, Search, Shield, RefreshCw, AlertCircle, CheckCircle2, Trophy, Plus } from 'lucide-react';

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
  const [selectedPeriod, setSelectedPeriod] = useState<'Todos' | 'Hoje' | 'Próximos' | 'Passados'>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [isMatchModalOpen, setIsMatchModalOpen] = useState<boolean>(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isTelegramSettingsOpen, setIsTelegramSettingsOpen] = useState<boolean>(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);

  // Toast Feedback State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [matchesRes, statusRes, configRes, logsRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/status'),
        fetch('/api/telegram/config'),
        fetch('/api/logs')
      ]);

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        setTelegramSettings(configData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
    } catch (err) {
      console.error('Falha ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers for Match CRUD
  const handleSaveMatch = async (matchData: Partial<Match>) => {
    try {
      if (editingMatch) {
        const res = await fetch(`/api/matches/${editingMatch.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matchData)
        });
        if (!res.ok) throw new Error('Falha ao atualizar jogo');
        const updated = await res.json();
        setMatches(matches.map(m => m.id === updated.id ? updated : m));
        showToast('Jogo atualizado com sucesso! 🇭🇺');
      } else {
        const res = await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matchData)
        });
        if (!res.ok) throw new Error('Falha ao cadastrar jogo');
        const created = await res.json();
        setMatches([created, ...matches]);
        showToast('Novo jogo do Fluminense cadastrado! ⚽');
      }
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar jogo', 'error');
    }
  };

  const handleDeleteMatch = async (id: string) => {
    try {
      const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir jogo');
      setMatches(matches.filter(m => m.id !== id));
      showToast('Jogo excluído com sucesso');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir jogo', 'error');
    }
  };

  // Handlers for Tasks
  const handleToggleTask = async (matchId: string, taskId: string, completed: boolean) => {
    try {
      // Optimistic update
      setMatches(matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            tasks: m.tasks.map(t => t.id === taskId ? { ...t, completed } : t)
          };
        }
        return m;
      }));

      const res = await fetch(`/api/matches/${matchId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });

      if (!res.ok) throw new Error('Falha ao atualizar tarefa');
    } catch (err: any) {
      showToast('Erro ao atualizar tarefa', 'error');
      fetchData();
    }
  };

  const handleAddTask = async (matchId: string, text: string) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('Falha ao adicionar tarefa');
      const newTask = await res.json();

      setMatches(matches.map(m => {
        if (m.id === matchId) {
          return { ...m, tasks: [...m.tasks, newTask] };
        }
        return m;
      }));
      showToast('Tarefa adicionada!');
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar tarefa', 'error');
    }
  };

  const handleDeleteTask = async (matchId: string, taskId: string) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Falha ao excluir tarefa');

      setMatches(matches.map(m => {
        if (m.id === matchId) {
          return { ...m, tasks: m.tasks.filter(t => t.id !== taskId) };
        }
        return m;
      }));
    } catch (err: any) {
      showToast('Erro ao remover tarefa', 'error');
    }
  };

  // Telegram Config & Dispatches
  const handleSaveTelegramSettings = async (botToken: string, chatId: string) => {
    const res = await fetch('/api/telegram/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken, chatId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao salvar configurações');
    showToast('Configurações do Telegram salvas!');
    fetchData();
  };

  const handleSendTestNotification = async (customMessage?: string, matchId?: string) => {
    const res = await fetch('/api/telegram/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customMessage, matchId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Falha no envio de teste');
    fetchData();
    return data;
  };

  const handleTriggerTodayCron = async () => {
    try {
      setIsTriggeringCron(true);
      const res = await fetch('/api/cron/reminders');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Falha ao rodar verificação do Cron');

      if (data.matchesTodayCount === 0) {
        showToast('Nenhum jogo do Fluminense agendado para hoje', 'info');
      } else {
        showToast(`Lembrete disparado para ${data.matchesTodayCount} jogo(s) de hoje! 🇭🇺`, 'success');
      }
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao rodar Vercel Cron', 'error');
    } finally {
      setIsTriggeringCron(false);
    }
  };

  const handleClearLogs = async () => {
    await fetch('/api/logs', { method: 'DELETE' });
    setLogs([]);
    showToast('Histórico limpo');
  };

  // Find next upcoming match for Hero banner
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingMatches = [...matches]
    .filter(m => m.date >= todayStr)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  
  const nextMatch = upcomingMatches[0] || matches[0] || null;

  // Filter matches for list
  const filteredMatches = matches.filter(m => {
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
  });

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

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Competition Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-bold text-stone-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Filtrar:
                </span>

                {['Todos', 'Brasileirão', 'Copa Libertadores', 'Copa do Brasil', 'Campeonato Carioca'].map(comp => (
                  <button
                    key={comp}
                    onClick={() => setSelectedComp(comp)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedComp === comp
                        ? 'bg-[#722F37] text-white shadow-sm'
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
                <span>Carregando calendário de jogos...</span>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
                <Shield className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="text-base font-bold text-stone-800">Nenhum jogo do Fluminense encontrado</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Não encontramos jogos para o filtro selecionado. Tente alterar os filtros ou cadastre um novo confronto.
                </p>
                <button
                  onClick={() => {
                    setEditingMatch(null);
                    setIsMatchModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#722F37] hover:bg-[#5a0c1a] text-white text-xs font-bold rounded-xl shadow transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Novo Jogo</span>
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
                        .then(() => showToast(`Lembrete disparado no Telegram para Fluminense vs ${m.opponent}! 🇭🇺`))
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
