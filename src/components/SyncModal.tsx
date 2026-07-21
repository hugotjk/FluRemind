import React, { useState } from 'react';
import { X, Smartphone, RefreshCw, Copy, Check, ShieldCheck, HelpCircle } from 'lucide-react';
import { getSyncCode, setSyncCode } from '../utils/syncManager';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySyncCode: (newCode: string) => void;
  onForceSync: () => void;
  isSyncing: boolean;
}

export const SyncModal = ({
  isOpen,
  onClose,
  onApplySyncCode,
  onForceSync,
  isSyncing
}: SyncModalProps) => {
  const [currentCode, setCurrentCode] = useState(getSyncCode());
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const clean = inputCode.trim().toUpperCase();
    setSyncCode(clean);
    setCurrentCode(clean);
    onApplySyncCode(clean);
    setInputCode('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#004d26] to-[#722F37] text-white p-5 flex items-center justify-between border-b-2 border-[#e6b800]">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#e6b800]" />
            <div>
              <h2 className="text-base font-black font-serif">Sincronizar em Múltiplos Aparelhos</h2>
              <p className="text-xs text-stone-200">Acesse suas tarefas do Fluminense no Celular e PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-stone-800">
          
          {/* Active Sync Code Box */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Seu Código de Sincronização Atual:
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-black font-mono tracking-widest text-[#722F37] bg-white px-4 py-1.5 rounded-xl border border-stone-300 shadow-inner">
                {currentCode}
              </span>
              <button
                onClick={handleCopy}
                className="p-2 bg-stone-200 hover:bg-stone-300 rounded-xl transition-colors text-stone-700"
                title="Copiar Código"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-stone-500">
              Digite este mesmo código no seu celular ou outro computador para compartilhar a lista em tempo real.
            </p>
          </div>

          {/* Connect Another Device Form */}
          <form onSubmit={handleApply} className="space-y-3 pt-2 border-t border-stone-200">
            <label className="block text-xs font-bold text-stone-700 uppercase">
              Conectar com Outro Aparelho (Insira o Código):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ex: FLU-88219"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="flex-1 text-sm font-mono uppercase px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#722F37]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#722F37] hover:bg-[#5a0c1a] text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                Sincronizar
              </button>
            </div>
          </form>

          {/* Force Sync Button */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-200">
            <button
              onClick={onForceSync}
              disabled={isSyncing}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando Nuvem...' : 'Sincronizar Agora 🔄'}</span>
            </button>
          </div>

          {/* Explanation Box */}
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Como funciona o armazenamento?</span>
              Suas tarefas e confirmações são salvas localmente no navegador e enviadas para a nuvem sincronizada. Você pode adicionar, marcar ou concluir tarefas no celular ou no PC.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
