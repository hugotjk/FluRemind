import React from 'react';
import { Calendar, History, Send, Terminal, Settings, Shield, BellRing, Sparkles, Plus, CloudCheck, RefreshCw } from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  activeTab: 'matches' | 'past_matches' | 'logs' | 'export';
  setActiveTab: (tab: 'matches' | 'past_matches' | 'logs' | 'export') => void;
  status: SystemStatus | null;
  onOpenTelegramSettings: () => void;
  onOpenTestNotification: () => void;
  onOpenAddMatch: () => void;
  onTriggerCronToday: () => void;
  isTriggeringCron: boolean;
  onSyncFixtures: () => void;
  isSyncingFixtures: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  status,
  onOpenTelegramSettings,
  onOpenTestNotification,
  onOpenAddMatch,
  onTriggerCronToday,
  isTriggeringCron,
  onSyncFixtures,
  isSyncingFixtures
}) => {
  return (
    <header className="bg-gradient-to-r from-[#5a0c1a] via-[#722F37] to-[#004d26] text-white border-b-4 border-[#e6b800] shadow-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-inner">
                🇭🇺
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status?.telegramConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-[#722F37] ${status?.telegramConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 font-serif">
                  FluRemind <span className="text-[#e6b800] font-normal text-xs font-sans px-2 py-0.5 rounded-full bg-black/30 border border-[#e6b800]/40">FFC 1902</span>
                </h1>
              </div>
              <p className="text-xs text-white/80 font-medium">
                Gerenciador de Jogos & Lembretes no Telegram
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-black/25 p-1 rounded-xl border border-white/10 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'matches'
                  ? 'bg-white text-[#722F37] shadow-md font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Próximos Jogos</span>
            </button>

            <button
              onClick={() => setActiveTab('past_matches')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'past_matches'
                  ? 'bg-white text-[#722F37] shadow-md font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Jogos Anteriores</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'bg-white text-[#722F37] shadow-md font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Histórico de Envios</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'export'
                  ? 'bg-[#e6b800] text-[#5a0c1a] shadow-md font-bold'
                  : 'text-[#e6b800] hover:bg-[#e6b800]/10 border border-[#e6b800]/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Guia Vercel & Code</span>
            </button>
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            
            {/* Primary Add Match Button */}
            <button
              onClick={onOpenAddMatch}
              className="flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-lg bg-[#e6b800] hover:bg-amber-400 text-[#5a0c1a] shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Cadastrar Jogo</span>
            </button>

            {/* Telegram Status Pill */}
            <button
              onClick={onOpenTelegramSettings}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                status?.telegramConfigured
                  ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500/40 hover:bg-emerald-900/60'
                  : 'bg-amber-950/60 text-amber-200 border-amber-500/40 hover:bg-amber-900/60'
              }`}
              title="Configurar Telegram Bot"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Telegram:</span>
              <span className="font-bold">
                {status?.telegramConfigured ? 'Conectado ✅' : 'Configurar ⚠️'}
              </span>
              <Settings className="w-3 h-3 text-white/60 ml-0.5" />
            </button>

            {/* Manual Test Notification Button */}
            <button
              onClick={onOpenTestNotification}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow transition-all active:scale-95"
              title="Testar Envio no Telegram"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Testar Envio</span>
            </button>

            {/* Run Today's Cron Button */}
            <button
              onClick={onTriggerCronToday}
              disabled={isTriggeringCron}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white shadow transition-all active:scale-95"
              title="Disparar verificação de hoje (Simular Vercel Cron)"
            >
              <Shield className={`w-3.5 h-3.5 ${isTriggeringCron ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Verificar Hoje</span>
            </button>

            {/* Sync Fixtures Button (Sofascore & APIs) */}
            <button
              onClick={onSyncFixtures}
              disabled={isSyncingFixtures}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white shadow transition-all active:scale-95"
              title="Buscar atualização dos jogos do Fluminense no Sofascore e APIs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFixtures ? 'animate-spin' : ''}`} />
              <span>{isSyncingFixtures ? 'Sincronizando...' : 'Sincronizar Jogos'}</span>
            </button>

            {/* Auto Cloud Sync Badge */}
            <div
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-black/40 text-emerald-300 border border-emerald-500/30 shadow-inner"
              title="Sincronização automática ativa em todos os dispositivos que acessarem o link"
            >
              <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Sincronizado na Nuvem</span>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
