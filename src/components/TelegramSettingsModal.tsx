import React, { useState, useEffect } from 'react';
import { X, Send, Key, MessageSquare, CheckCircle, AlertTriangle, ExternalLink, RefreshCw, Shield, Info, Clock, Calendar, Plus, Trash2 } from 'lucide-react';
import { TelegramSettings, AutoScheduleSettings } from '../types';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TelegramSettings | null;
  onSaveSettings: (botToken: string, chatId: string, autoSchedule?: AutoScheduleSettings) => Promise<void>;
  onTestConnection: () => Promise<void>;
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

export const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTestConnection
}) => {
  const DEFAULT_BOT_TOKEN = '8951861356:AAHo0fczfX2TORYkuNQT8VMcN5aRdSuhLsc';
  const DEFAULT_CHAT_ID = '640896648';

  const [botToken, setBotToken] = useState(DEFAULT_BOT_TOKEN);
  const [chatId, setChatId] = useState(DEFAULT_CHAT_ID);
  
  // Auto Schedule State
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [times, setTimes] = useState<string[]>(['09:00', '12:00', '18:00']);
  const [onlyMatchDays, setOnlyMatchDays] = useState(false);
  const [newTime, setNewTime] = useState('10:00');

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setBotToken(settings.botToken || DEFAULT_BOT_TOKEN);
      setChatId(settings.chatId || DEFAULT_CHAT_ID);
      if (settings.autoSchedule) {
        setAutoEnabled(settings.autoSchedule.enabled ?? true);
        setSelectedDays(settings.autoSchedule.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
        setTimes(settings.autoSchedule.notificationTimes || ['09:00', '12:00', '18:00']);
        setOnlyMatchDays(settings.autoSchedule.onlyOnMatchDays ?? false);
      }
    } else {
      setBotToken(DEFAULT_BOT_TOKEN);
      setChatId(DEFAULT_CHAT_ID);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) return; // Mínimo 1 dia
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
    if (times.length === 1) return; // Mínimo 1 horário
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
      setStatusMessage({ type: 'success', text: 'Configurações e agendamento salvos com sucesso!' });
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
      setStatusMessage({ type: 'success', text: 'Mensagem enviada com sucesso! Verifique seu Telegram. 🇭🇺' });
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : err?.message || JSON.stringify(err) || 'Falha no envio de teste';
      setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-sky-950 text-white p-5 flex items-center justify-between border-b-2 border-sky-400">
          <div className="flex items-center gap-2">
            <Send className="w-6 h-6 text-sky-400" />
            <div>
              <h2 className="text-lg font-black">Configurações & Agendamento do Telegram</h2>
              <p className="text-xs text-sky-200">Escolha os dias, horários e chave do bot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Status Message Alert */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Environmental variables status indicator */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
            <div className="font-bold text-stone-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#722F37]" />
              <span>Status das Variáveis de Ambiente do Servidor:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-white border border-stone-200 flex items-center justify-between">
                <span className="font-mono text-stone-600">TELEGRAM_BOT_TOKEN:</span>
                <span className={`font-bold ${settings?.hasEnvToken ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {settings?.hasEnvToken ? 'Ativo (Vercel) ✅' : 'Manual/Form ℹ️'}
                </span>
              </div>
              <div className="p-2 rounded bg-white border border-stone-200 flex items-center justify-between">
                <span className="font-mono text-stone-600">TELEGRAM_CHAT_ID:</span>
                <span className={`font-bold ${settings?.hasEnvChatId ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {settings?.hasEnvChatId ? 'Ativo (Vercel) ✅' : 'Manual/Form ℹ️'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            
            {/* Credenciais Telegram */}
            <div className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
              <h3 className="text-xs font-black uppercase text-stone-800 tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-sky-600" /> Credenciais do Telegram
              </h3>

              {/* Bot Token */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center justify-between">
                  <span>Bot Token</span>
                  <button
                    type="button"
                    onClick={() => window.open('https://t.me/BotFather', '_blank', 'noopener,noreferrer')}
                    className="text-sky-600 hover:underline flex items-center gap-0.5 text-[11px] lowercase font-normal cursor-pointer"
                  >
                    criar no @BotFather <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full text-xs font-mono px-3.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>

              {/* Chat ID */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center justify-between">
                  <span>Chat ID</span>
                  <button
                    type="button"
                    onClick={() => window.open('https://t.me/userinfobot', '_blank', 'noopener,noreferrer')}
                    className="text-sky-600 hover:underline flex items-center gap-0.5 text-[11px] lowercase font-normal cursor-pointer"
                  >
                    descobrir no @userinfobot <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </label>
                <input
                  type="text"
                  placeholder="Ex: 987654321 ou -100123456789"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="w-full text-xs font-mono px-3.5 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>

            {/* Agendamento Automático de Notificações */}
            <div className="space-y-4 p-4 bg-sky-50/70 rounded-xl border border-sky-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-700" />
                  <div>
                    <h3 className="text-xs font-black uppercase text-sky-950 tracking-wide">Agendamento de Notificações Automáticas</h3>
                    <p className="text-[11px] text-sky-800">Escolha os dias e horários para receber os alertas no Telegram</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoEnabled}
                    onChange={(e) => setAutoEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {autoEnabled && (
                <div className="space-y-3 pt-2 border-t border-sky-200/80 animate-fadeIn">
                  
                  {/* Dias da Semana */}
                  <div>
                    <label className="block text-xs font-bold text-sky-950 uppercase mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-700" /> Dias da Semana Ativos:
                    </label>
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS.map(day => {
                        const isSelected = selectedDays.includes(day.id);
                        return (
                          <button
                            type="button"
                            key={day.id}
                            onClick={() => toggleDay(day.id)}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-sky-700 text-white border-sky-800 shadow-sm'
                                : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-100'
                            }`}
                            title={day.fullName}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Horários de Notificação */}
                  <div>
                    <label className="block text-xs font-bold text-sky-950 uppercase mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sky-700" /> Horários de Envio Diários:
                    </label>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {times.map(t => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-lg bg-white border border-sky-300 text-sky-950 text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          ⏰ {t}
                          <button
                            type="button"
                            onClick={() => handleRemoveTime(t)}
                            className="text-stone-400 hover:text-rose-600 ml-1"
                            title="Remover horário"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddTime}
                        className="px-3 py-1.5 bg-sky-800 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Horário
                      </button>
                    </div>
                  </div>

                  {/* Filtro: Apenas em Dias de Jogos x Todos os Dias */}
                  <div className="pt-2 border-t border-sky-200/60">
                    <label className="flex items-center gap-2 text-xs text-sky-950 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyMatchDays}
                        onChange={(e) => setOnlyMatchDays(e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                      />
                      <span>Enviar notificações <strong>apenas em dias que houver jogo cadastrado do Fluminense</strong></span>
                    </label>
                  </div>

                </div>
              )}

            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-200">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Testar Envio Agora</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow transition-all disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </form>

          {/* Quick Setup Instructions */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
            <div className="font-bold flex items-center gap-1 text-stone-900">
              <Info className="w-4 h-4 text-sky-600" /> Dica de Automação Vercel:
            </div>
            <p className="text-[11px] text-stone-600">
              O agendamento configurado acima é verificado automaticamente sempre que a Vercel Cron ou a aplicação chamar a rota <code className="bg-stone-200 px-1 py-0.5 rounded">/api/cron/reminders</code>.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
