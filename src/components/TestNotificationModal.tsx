import React, { useState } from 'react';
import { X, Send, BellRing, Sparkles, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Match } from '../types';

interface TestNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  onSendCustomNotification: (customMessage: string, matchId?: string) => Promise<any>;
}

export const TestNotificationModal: React.FC<TestNotificationModalProps> = ({
  isOpen,
  onClose,
  matches,
  onSendCustomNotification
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [useMatchTemplate, setUseMatchTemplate] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setResult(null);

    try {
      const matchIdToSend = useMatchTemplate && selectedMatchId ? selectedMatchId : undefined;
      const textToSend = !useMatchTemplate ? customText : undefined;

      const res = await onSendCustomNotification(textToSend || '', matchIdToSend);
      setResult({
        success: true,
        message: 'Mensagem disparada com sucesso! Verifique a caixa do Telegram. 🇭🇺',
        data: res
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Falha ao disparar notificação'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-800 text-white p-5 flex items-center justify-between border-b-2 border-sky-300">
          <div className="flex items-center gap-2">
            <BellRing className="w-6 h-6 text-sky-200" />
            <div>
              <h2 className="text-lg font-black">Testar Disparo no Telegram</h2>
              <p className="text-xs text-sky-100">Simule o envio manual de notificações e lembretes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Result Alert */}
          {result && (
            <div className={`p-4 rounded-xl text-xs space-y-1 ${
              result.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-rose-50 text-rose-900 border border-rose-300'
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {result.success ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{result.success ? 'Enviado!' : 'Erro no Envio'}</span>
              </div>
              <p>{result.message}</p>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex rounded-xl p-1 bg-stone-100 border border-stone-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setUseMatchTemplate(true)}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                useMatchTemplate ? 'bg-white text-stone-900 shadow' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ⚽ Lembrete de Jogo do Flu
            </button>
            <button
              type="button"
              onClick={() => setUseMatchTemplate(false)}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                !useMatchTemplate ? 'bg-white text-stone-900 shadow' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ✍️ Mensagem Personalizada
            </button>
          </div>

          {useMatchTemplate ? (
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Selecione o jogo para gerar a mensagem formatada:
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
              >
                <option value="">-- Próximo Jogo / Padrão Geral --</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    Fluminense vs {m.opponent} ({m.date.split('-').reverse().join('/')} às {m.time}) - {m.competition}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-500 mt-1.5">
                A mensagem incluirá os emojis tricolores 🇭🇺, local do jogo, horário e checklist de tarefas pendentes formatados em Markdown.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Texto em Markdown para enviar:
              </label>
              <textarea
                rows={4}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="🇭🇺 *MENSAGEM TRICOLOR DE TESTE* ⚽&#10;&#10;Olá! Testando envio de avisos..."
                className="w-full text-xs font-mono p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Fechar
            </button>

            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Disparar Notificação 🚀</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
