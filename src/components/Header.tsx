import React from 'react';
import { Calendar, CalendarDays, History, Settings } from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  activeTab: 'matches' | 'past_matches' | 'calendar' | 'logs';
  setActiveTab: (tab: 'matches' | 'past_matches' | 'calendar' | 'logs') => void;
  status: SystemStatus | null;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  status,
  onOpenSettings
}) => {
  const isServerConfigured = status?.telegramConfigured;
  const isOnline = status !== null ? isServerConfigured : true;

  const statusBg = isOnline ? 'bg-emerald-500' : 'bg-amber-500';
  const pingBg = isOnline ? 'bg-emerald-400' : 'bg-amber-400';
  const statusTooltip = status
    ? (isServerConfigured ? 'Servidor Ativo & Telegram Configurado' : 'Servidor Conectado (Telegram não configurado)')
    : 'Sincronizado com Planilha Base do Google';

  return (
    <header className="bg-gradient-to-r from-[#5a0c1a] via-[#722F37] to-[#004d26] text-white border-b-4 border-[#e6b800] shadow-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="relative cursor-help" title={statusTooltip}>
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-inner">
                🇭🇺
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingBg}`}></span>
                <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-[#722F37] ${statusBg}`}></span>
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'matches'
                  ? 'bg-white text-[#722F37] shadow-md font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Próximos Jogos (Casa)</span>
            </button>

            <button
              onClick={() => setActiveTab('past_matches')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'past_matches'
                  ? 'bg-white text-[#722F37] shadow-md font-bold'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Jogos Anteriores</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-[#e6b800] text-[#5a0c1a] shadow-md font-black'
                  : 'text-[#e6b800] hover:bg-white/10'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>📅 Calendário Geral</span>
            </button>
          </nav>

          {/* Header Action: Calendar Tab beside Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow cursor-pointer active:scale-95 border ${
                activeTab === 'calendar'
                  ? 'bg-[#e6b800] text-[#5a0c1a] border-[#e6b800]'
                  : 'bg-white/10 hover:bg-white/20 border-white/25 text-[#e6b800]'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-[#e6b800]" />
              <span>Calendário</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
            >
              <Settings className="w-4 h-4 text-[#e6b800]" />
              <span>Configuração</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
