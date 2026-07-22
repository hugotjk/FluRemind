import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { Match } from '../types';
import { formatMatchTeams } from '../utils/teamLogos';

interface NextMatchHeroProps {
  match: Match | null;
  onOpenChecklist?: (match: Match) => void;
  onTestTelegramMatch?: (match: Match) => void;
}

export const NextMatchHero: React.FC<NextMatchHeroProps> = ({
  match
}) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isToday: boolean } | null>(null);

  useEffect(() => {
    if (!match) return;

    const calculateTime = () => {
      const matchDateTime = new Date(`${match.date}T${match.time}:00`);
      const now = new Date();
      const diff = matchDateTime.getTime() - now.getTime();

      const todayStr = now.toISOString().split('T')[0];
      const isToday = match.date === todayStr;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isToday });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isToday });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [match]);

  if (!match) {
    return (
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-6 shadow-xl border border-stone-700 text-center">
        <Shield className="w-12 h-12 text-[#e6b800] mx-auto mb-2 opacity-80" />
        <h3 className="text-lg font-bold">Nenhum próximo jogo do Fluminense em casa</h3>
        <p className="text-xs text-stone-400 mt-1">Os jogos em casa serão sincronizados automaticamente da planilha do Google Drive.</p>
      </div>
    );
  }

  const tasks = match.tasks || [];
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a0815] via-[#611221] to-[#00381b] border-2 border-[#e6b800]/60 text-white p-6 shadow-2xl">
      {/* Background Accent Graphics */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#e6b800]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-[#008040]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left Side: Game details */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            {timeLeft?.isToday ? (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse border border-rose-400 flex items-center gap-1">
                🔥 É HOJE! JOGO DO DIA 🇭🇺
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#e6b800] text-[#5a0c1a] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> PRÓXIMO JOGO
              </span>
            )}

            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/20">
              {match.competition}
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              {match.isHome ? '🏠 Casa' : '✈️ Fora'}
            </span>
          </div>

          {(() => {
            const { homeTeam, homeLogo, homeIsFlu, awayTeam, awayLogo, awayIsFlu } = formatMatchTeams(match);
            return (
              <div className="flex items-center gap-3 flex-wrap py-1">
                {/* Mandante (Foto à esquerda) */}
                <div className="flex items-center gap-2">
                  <img
                    src={homeLogo}
                    alt={homeTeam}
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0 bg-white/10 rounded-full p-1 border border-white/20"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <span className={`text-2xl sm:text-3xl font-black font-serif tracking-tight ${homeIsFlu ? 'text-white' : 'text-amber-100'}`}>
                    {homeTeam}
                  </span>
                </div>

                <span className="text-xl sm:text-2xl font-bold text-[#e6b800] px-1">VS</span>

                {/* Visitante (Foto à direita) */}
                <div className="flex items-center gap-2">
                  <span className={`text-2xl sm:text-3xl font-black font-serif tracking-tight ${awayIsFlu ? 'text-white' : 'text-amber-100'}`}>
                    {awayTeam}
                  </span>
                  <img
                    src={awayLogo}
                    alt={awayTeam}
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0 bg-white/10 rounded-full p-1 border border-white/20"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              </div>
            );
          })()}

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-200">
            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-[#e6b800]" />
              <span>{match.date ? match.date.split('-').reverse().join('/') : 'Data a definir'}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
              <Clock className="w-3.5 h-3.5 text-[#e6b800]" />
              <span>{match.time || '16:00'} hrs</span>
            </div>
          </div>

          {match.notes && (
            <p className="text-xs text-amber-200/90 italic bg-black/20 p-2.5 rounded-lg border border-amber-500/20">
              "{match.notes}"
            </p>
          )}

          {/* Checklist Progress */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-stone-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Checklist do Jogo
              </span>
              <span className="text-[#e6b800]">
                {completedTasks}/{totalTasks} concluídas ({progressPercent}%)
              </span>
            </div>

            <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
              <div
                className="bg-gradient-to-r from-emerald-500 to-[#e6b800] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right Side: Countdown Timer */}
        <div className="flex flex-col items-center lg:items-end gap-4 min-w-[240px]">
          {/* Countdown Clock */}
          {timeLeft && (
            <div className="bg-black/40 backdrop-blur-md p-3.5 rounded-xl border border-white/15 w-full text-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-1">
                Tempo Restante
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-white/5 p-1.5 rounded">
                  <span className="text-xl font-black text-[#e6b800] font-mono">{timeLeft.days}</span>
                  <span className="text-[9px] block text-stone-300">dias</span>
                </div>
                <div className="bg-white/5 p-1.5 rounded">
                  <span className="text-xl font-black text-white font-mono">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[9px] block text-stone-300">hrs</span>
                </div>
                <div className="bg-white/5 p-1.5 rounded">
                  <span className="text-xl font-black text-white font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[9px] block text-stone-300">min</span>
                </div>
                <div className="bg-white/5 p-1.5 rounded">
                  <span className="text-xl font-black text-emerald-400 font-mono">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[9px] block text-stone-300">seg</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
