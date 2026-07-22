import React, { useState, useEffect } from 'react';
import {
  X, Send, Key, MessageSquare, CheckCircle, AlertTriangle, RefreshCw, Shield, Clock, Calendar, Plus, Trash2, Database, ListFilter
} from 'lucide-react';
import { TelegramSettings, AutoScheduleSettings, SystemStatus, NotificationLog } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TelegramSettings | null;
  status: SystemStatus | null;
  logs: NotificationLog[];
  onSaveSettings: (botToken: string, chatId: string, autoSchedule?: AutoScheduleSettings) => Promise<void>;
  onTestConnection: () => Promise<void>;
  onTriggerCronNow: () => Promise<void>;
  onSyncSheetNow: () => Promise<void>;
  onClearLogs: () => Promise<void>;
}

const DAYS = [
  { id: 0, label: 'Dom', fullName: 'Domingo' },
  { id: 1, label: 'Seg', fullName: 'Segunda-feira' },
  { id: 2, label: 'Ter', fullName: 'Terça-feira' },
  { id: 3, label: 'Qua', fullName: 'Quarta-feira' },
  { id: 4, label: 'Qui', fullName: 'Quinta-feira' },
  { id: 5, label: 'Sex', fullName: 'Sexta-feira' },
  { id: 6, label: 'Sáb', fullName: 'Sábado' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  logs,
  onSaveSettings,
  onTestConnection,
  onTriggerCronNow,
  onSyncSheetNow,
  onClearLogs
}) => {
  const DEFAULT_BOT_TOKEN = '8951861356:AAHo0fczfX2TORYkuNQT8VMcN5aRdSuhLsc';
  const DEFAULT_CHAT_ID = '640896648';

  const [activeTab, setActiveTab] = useState<'telegram' | 'schedule' | 'sync' | 'logs'>('telegram');

  // Form State
  const [botToken, setBotToken] = useState(DEFAULT_BOT_TOKEN);
  const [chatId, setChatId] = useState(DEFAULT_CHAT_ID);

  // Auto Schedule State
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [times, setTimes] = useState<string[]>(['08:00', '12:00', '18:00']);
  const [onlyMatchDays, setOnlyMatchDays] = useState(false);
  const [newTime, setNewTime] = useState('10:00');

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setBotToken(settings.botToken || DEFAULT_BOT_TOKEN);
      setChatId(settings.chatId || DEFAULT_CHAT_ID);
      if (settings.autoSchedule) {
        setAutoEnabled(settings.autoSchedule.enabled ?? true);
        setSelectedDays(settings.autoSchedule.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
        setTimes(settings.autoSchedule.notificationTimes || ['08:00', '12:00', '18:00']);
        setOnlyMatchDays(settings.autoSchedule.onlyOnMatchDays ?? false);
      }
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) return;
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId].sort());
    }
  };

  const handleAddTime = () => {
    if (!newTime) return;
    if (!times.includes(newTime)) {
      setTimes([...times, newTime].sort());
    }
  };

  const handleRemoveTime = (timeToRemove: string) => {
    if (times.length === 1) return;
    setTimes(times.filter(t => t !== timeToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      let finalTimes = [...times];
      if (newTime && !finalTimes.includes(newTime)) {
        finalTimes = [...finalTimes, newTime].sort();
        setTimes(finalTimes);
      }

      const autoSchedule: AutoScheduleSettings = {
        enabled: autoEnabled,
        daysOfWeek: selectedDays,
        notificationTimes: finalTimes,
        onlyOnMatchDays: onlyMatchDays
      };

      await onSaveSettings(botToken.trim(), chatId.trim(), autoSchedule);
      setStatusMessage({ type: 'success', text: 'Configurações do Telegram e Agendamento salvas com sucesso!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao salvar configurações' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setStatusMessage(null);
    try {
      await onTestConnection();
      setStatusMessage({ type: 'success', text: 'Mensagem de teste enviada com sucesso no Telegram! 🇭🇺' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Falha ao enviar mensagem de teste' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTriggerCron = async () => {
    setIsCronRunning(true);
    setStatusMessage(null);
    try {
      await onTriggerCronNow();
      setStatusMessage({ type: 'success', text: 'Notificação do próximo jogo disparada no Telegram com sucesso!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Falha ao disparar notificação' });
    } finally {
      setIsCronRunning(false);
    }
  };

  const handleSyncSheet = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      await onSyncSheetNow();
      setStatusMessage({ type: 'success', text: 'Jogos sincronizados com a planilha do Google Drive!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Falha ao sincronizar planilha' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Top Tabs */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-5 border-b border-stone-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#e6b800]" />
              <div>
                <h2 className="text-lg font-bold font-serif">Painel de Configurações</h2>
                <p className="text-xs text-stone-300">Gerencie o Telegram, Agendamentos, Planilha e Logs</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('telegram')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'telegram'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>1. Telegram</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>2. Agendamento</span>
            </button>

            <button
              onClick={() => setActiveTab('sync')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'sync'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>3. Planilha Drive</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>4. Logs ({logs.length})</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Message Alert */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
              statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
              <button onClick={() => setStatusMessage(null)} className="text-stone-400 hover:text-stone-600">×</button>
            </div>
          )}

          {/* TAB 1: TELEGRAM */}
          {activeTab === 'telegram' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-sky-600" />
                  Credenciais do Bot
                </h3>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Bot Token:</label>
                  <input
                    type="text"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Ex: 8951861356:AAHo0fczfX2TORY..."
                    className="w-full text-xs font-mono p-2.5 rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Chat ID do Telegram:</label>
                  <input
                    type="text"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="Ex: 640896648"
                    className="w-full text-xs font-mono p-2.5 rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Credenciais'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testando...' : 'Testar Envio'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: AGENDAMENTO */}
          {activeTab === 'schedule' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <div>
                      <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Lembretes Automáticos</h3>
                      <p className="text-[11px] text-stone-500">Envio automático da mensagem do próximo jogo do Fluminense</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoEnabled}
                      onChange={(e) => setAutoEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Days Selection */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-2">Dias de Disparo:</label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS.map(day => {
                      const isSelected = selectedDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleDay(day.id)}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all text-center cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Times Selection */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-2">Horários das Notificações (Brasília UTC-3):</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {times.map(t => (
                      <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">
                        <Clock className="w-3 h-3 text-emerald-700" />
                        {t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTime(t)}
                          className="hover:text-rose-600 p-0.5 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="text-xs p-2 rounded-lg border border-stone-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddTime}
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Horário
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-2 leading-snug bg-stone-50 p-2 rounded-lg border border-stone-200/80">
                    💡 <strong>Regra de Disparo:</strong> As notificações das <strong>08:00</strong> e <strong>18:00</strong> ocorrem diariamente. O horário das <strong>12:00</strong> é enviado automaticamente na <strong>véspera</strong> e no <strong>dia</strong> dos jogos do Fluminense.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Agendamento'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerCron}
                  disabled={isCronRunning}
                  className="py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${isCronRunning ? 'animate-spin' : ''}`} />
                  <span>{isCronRunning ? 'Enviando...' : 'Notificar Próximo Jogo Agora'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SINCRONIZAÇÃO */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-600" />
                  Planilha Google Drive Compartilhada
                </h3>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">URL da Planilha de Jogos:</label>
                  <input
                    type="text"
                    readOnly
                    value="https://docs.google.com/spreadsheets/d/1BgoimzpqdL5UXpCw12vz4BiSuRYxIlGr/edit"
                    className="w-full text-xs font-mono p-2.5 rounded-lg border border-stone-300 bg-stone-100 text-stone-700 select-all"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <span>⚡ Sincronização Automática Ativa:</span>
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    O aplicativo atualiza os jogos automaticamente a cada abertura e diariamente às <strong>08h, 12h e 18h</strong> (Horário de Brasília).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncSheet}
                disabled={isSyncing}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Jogos com Google Drive Agora'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Histórico de Mensagens ({logs.length})</h3>
                {logs.length > 0 && (
                  <button
                    onClick={onClearLogs}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpar Logs
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-8 text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                  Nenhuma notificação registrada ainda.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-stone-500 font-mono text-[10px]">
                        <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded ${log.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {log.success ? 'ENVIADO ✅' : 'ERRO ❌'}
                        </span>
                      </div>
                      <p className="font-mono text-stone-800 whitespace-pre-wrap text-[11px] bg-white p-2 rounded border border-stone-200">
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
