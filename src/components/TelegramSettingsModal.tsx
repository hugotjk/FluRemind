import React, { useState, useEffect } from 'react';
import { X, Send, Key, MessageSquare, CheckCircle, AlertTriangle, ExternalLink, RefreshCw, Shield, Info } from 'lucide-react';
import { TelegramSettings } from '../types';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TelegramSettings | null;
  onSaveSettings: (botToken: string, chatId: string) => Promise<void>;
  onTestConnection: () => Promise<void>;
}

export const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTestConnection
}) => {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setBotToken(settings.botToken || '');
      setChatId(settings.chatId || '');
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await onSaveSettings(botToken.trim(), chatId.trim());
      setStatusMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
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
      setStatusMessage({ type: 'success', text: 'Mensagem de teste enviada com sucesso! Verifique seu Telegram. 🇭🇺' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Falha no envio de teste' });
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
              <h2 className="text-lg font-black">Configurar Bot do Telegram</h2>
              <p className="text-xs text-sky-200">Credenciais para recebimento de lembretes</p>
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
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
            <div className="font-bold text-stone-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#722F37]" />
              <span>Status das Variáveis de Ambiente do Servidor:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-white border border-stone-200 flex items-center justify-between">
                <span className="font-mono text-stone-600">TELEGRAM_BOT_TOKEN:</span>
                <span className={`font-bold ${settings?.hasEnvToken ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {settings?.hasEnvToken ? 'Ativo (Vercel/ENV) ✅' : 'Manual/Form ℹ️'}
                </span>
              </div>
              <div className="p-2 rounded bg-white border border-stone-200 flex items-center justify-between">
                <span className="font-mono text-stone-600">TELEGRAM_CHAT_ID:</span>
                <span className={`font-bold ${settings?.hasEnvChatId ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {settings?.hasEnvChatId ? 'Ativo (Vercel/ENV) ✅' : 'Manual/Form ℹ️'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-stone-500">
              Se as variáveis de ambiente estiverem configuradas na Vercel ou no arquivo <code className="bg-stone-200 px-1 py-0.5 rounded">.env</code>, elas terão prioridade automática.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Bot Token */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-sky-600" /> Telegram Bot Token
                </span>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:underline flex items-center gap-0.5 text-[11px] lowercase"
                >
                  criar no @BotFather <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </label>
              <input
                type="text"
                placeholder="Ex: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Chat ID */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-600" /> Telegram Chat ID
                </span>
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:underline flex items-center gap-0.5 text-[11px] lowercase"
                >
                  descobrir no @userinfobot <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </label>
              <input
                type="text"
                placeholder="Ex: 987654321 ou -100123456789"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
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
          <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1 text-sky-950">
              <Info className="w-4 h-4 text-sky-600" /> Passo a Passo Rápido:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-sky-900">
              <li>Abra o Telegram e converse com <strong>@BotFather</strong>. Digite <code className="bg-sky-200 px-1 py-0.5 rounded">/newbot</code>.</li>
              <li>Copie o <strong>HTTP API Token</strong> gerado e cole no campo acima.</li>
              <li>Inicie uma conversa com o bot recém-criado clicando em <strong>Start / Iniciar</strong>.</li>
              <li>Descubra seu Chat ID conversando com <strong>@userinfobot</strong> e cole acima!</li>
            </ol>
          </div>

        </div>

      </div>
    </div>
  );
};
