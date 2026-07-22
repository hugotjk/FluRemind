import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Shield, Sparkles, Filter, List, Grid } from 'lucide-react';
import { Match } from '../types';
import { formatMatchTeams } from '../utils/teamLogos';

interface CalendarViewProps {
  matches: Match[];
  onOpenTasks?: (match: Match) => void;
  onNotifyMatch?: (match: Match) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  matches,
  onOpenTasks,
  onNotifyMatch
}) => {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth()); // 0-indexed
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [filterVenue, setFilterVenue] = useState<'Todos' | 'Casa' | 'Fora'>('Todos');

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Filter matches for the current view
  const safeMatches = Array.isArray(matches) ? matches : [];

  const filteredMatches = safeMatches.filter(m => {
    if (!m) return false;
    if (filterVenue === 'Casa' && !m.isHome) return false;
    if (filterVenue === 'Fora' && m.isHome) return false;
    return true;
  });

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const startingWeekday = firstDayOfMonth.getDay(); // 0 = Sunday
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Create array of days for the grid
  const calendarCells = [];
  
  // Padding cells before day 1
  for (let i = 0; i < startingWeekday; i++) {
    calendarCells.push({ type: 'empty', id: `empty-start-${i}` });
  }

  // Actual day cells
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${currentYear}-${monthStr}-${dayStr}`;

    const dayMatches = filteredMatches.filter(m => m.date === dateKey);

    const isToday = 
      now.getFullYear() === currentYear &&
      now.getMonth() === currentMonth &&
      now.getDate() === day;

    calendarCells.push({
      type: 'day',
      id: `day-${dateKey}`,
      dayNumber: day,
      dateKey,
      matches: dayMatches,
      isToday
    });
  }

  // Padding cells after last day to fill row of 7
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    calendarCells.push({ type: 'empty', id: `empty-end-${i}` });
  }

  // Matches in the current month for list view or summary
  const monthMatches = filteredMatches
    .filter(m => {
      if (!m.date) return false;
      const [y, mth] = m.date.split('-').map(Number);
      return y === currentYear && mth === (currentMonth + 1);
    })
    .sort((a, b) => `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`));

  return (
    <div className="space-y-6">
      
      {/* Calendar Header Control Bar */}
      <div className="bg-gradient-to-r from-[#5a0c1a] via-[#722F37] to-[#004d26] text-white rounded-2xl p-5 shadow-xl border-2 border-[#e6b800]/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Title and Month Display */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-black/30 border border-[#e6b800]/40 flex items-center justify-center text-[#e6b800] shadow-inner shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-serif text-white tracking-tight">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-[#e6b800] text-[#5a0c1a]">
                {monthMatches.length} {monthMatches.length === 1 ? 'Jogo' : 'Jogos'}
              </span>
            </div>
            <p className="text-xs text-stone-200 mt-0.5">
              Calendário completo de confrontos do Fluminense (Mandante x Visitante)
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Venue Filter */}
          <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setFilterVenue('Todos')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterVenue === 'Todos' ? 'bg-[#e6b800] text-[#5a0c1a]' : 'text-stone-300 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterVenue('Casa')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterVenue === 'Casa' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:text-white'
              }`}
            >
              🏠 Casa
            </button>
            <button
              onClick={() => setFilterVenue('Fora')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterVenue === 'Fora' ? 'bg-rose-700 text-white' : 'text-stone-300 hover:text-white'
              }`}
            >
              ✈️ Fora
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-[#722F37]' : 'text-stone-300 hover:text-white'
              }`}
              title="Visão em Grade Mensal"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-[#722F37]' : 'text-stone-300 hover:text-white'
              }`}
              title="Visão em Lista do Mês"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* MAIN VIEW: GRID OR LIST */}
      {viewMode === 'grid' ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden p-4">
          
          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
            {WEEKDAYS.map((wd, index) => (
              <div
                key={wd}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg ${
                  index === 0 || index === 6 ? 'bg-amber-50 text-amber-800' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 auto-rows-fr">
            {calendarCells.map(cell => {
              if (cell.type === 'empty') {
                return (
                  <div
                    key={cell.id}
                    className="min-h-[125px] sm:min-h-[145px] bg-stone-50/50 rounded-xl border border-stone-100/60 p-2"
                  ></div>
                );
              }

              const hasMatches = cell.matches && cell.matches.length > 0;

              return (
                <div
                  key={cell.id}
                  className={`min-h-[125px] sm:min-h-[145px] rounded-xl p-1.5 sm:p-2 border transition-all flex flex-col justify-between ${
                    cell.isToday
                      ? 'bg-amber-50/80 border-[#e6b800] ring-2 ring-[#e6b800]/30'
                      : hasMatches
                      ? 'bg-stone-50 border-stone-300 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* Cell Top Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black font-mono px-1.5 py-0.5 rounded-md ${
                      cell.isToday ? 'bg-[#722F37] text-white' : 'text-stone-700'
                    }`}>
                      {cell.dayNumber}
                    </span>
                    {cell.isToday && (
                      <span className="text-[9px] font-black uppercase text-[#722F37] hidden sm:inline">Hoje</span>
                    )}
                  </div>

                  {/* Cell Content: Matches on this day */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[150px]">
                    {hasMatches ? (
                      cell.matches.map((m, idx) => {
                        const { homeTeam, homeLogo, awayTeam, awayLogo } = formatMatchTeams(m);
                        return (
                          <div
                            key={`${m.id}-${idx}`}
                            onClick={() => setSelectedMatch(m)}
                            className={`p-1.5 rounded-xl border transition-all cursor-pointer hover:scale-[1.03] shadow-xs flex flex-col items-center justify-center text-center ${
                              m.isHome
                                ? 'bg-gradient-to-br from-[#5a0c1a] via-[#722F37] to-[#00381b] text-white border-[#e6b800]/60'
                                : 'bg-stone-800 text-stone-100 border-stone-600'
                            }`}
                          >
                            {/* Nome do Campeonato */}
                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tight text-[#e6b800] truncate max-w-full leading-tight mb-1">
                              {m.competition}
                            </span>

                            {/* Logo Centralizada do Mandante */}
                            <div className="flex flex-col items-center justify-center my-0.5">
                              <img
                                src={homeLogo}
                                alt={homeTeam}
                                className="w-6 h-6 sm:w-7 sm:h-7 object-contain bg-white/20 rounded-full p-0.5 border border-white/30 shadow-xs"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            </div>

                            {/* Logo Centralizada do Visitante (em baixo) */}
                            <div className="flex flex-col items-center justify-center my-0.5">
                              <img
                                src={awayLogo}
                                alt={awayTeam}
                                className="w-6 h-6 sm:w-7 sm:h-7 object-contain bg-white/20 rounded-full p-0.5 border border-white/30 shadow-xs"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST VIEW OF MATCHES FOR THE MONTH */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#722F37]" />
            Jogos em {MONTH_NAMES[currentMonth]} {currentYear} ({monthMatches.length})
          </h3>

          {monthMatches.length === 0 ? (
            <div className="p-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200 text-stone-400 text-xs">
              Nenhum jogo cadastrado para este mês ({MONTH_NAMES[currentMonth]} de {currentYear}).
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthMatches.map((match, idx) => {
                const { homeTeam, homeLogo, homeIsFlu, awayTeam, awayLogo, awayIsFlu } = formatMatchTeams(match);
                return (
                  <div
                    key={`${match.id}-${idx}`}
                    onClick={() => setSelectedMatch(match)}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-white hover:border-[#722F37] transition-all shadow-xs cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-stone-500 border-b border-stone-200 pb-2">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#722F37]" />
                        {match.date ? match.date.split('-').reverse().join('/') : ''} ({match.time} hrs)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        match.isHome ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {match.isHome ? '🏠 Casa (Mandante)' : '✈️ Fora (Visitante)'}
                      </span>
                    </div>

                    {/* Logos and Teams */}
                    <div className="flex items-center justify-between gap-2 py-2">
                      <div className="flex items-center gap-2 flex-1">
                        <img
                          src={homeLogo}
                          alt={homeTeam}
                          className="w-8 h-8 object-contain shrink-0 bg-stone-200/60 rounded-full p-1"
                        />
                        <span className={`text-xs font-bold truncate ${homeIsFlu ? 'text-[#722F37]' : 'text-stone-800'}`}>
                          {homeTeam}
                        </span>
                      </div>

                      <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded">VS</span>

                      <div className="flex items-center justify-end gap-2 flex-1">
                        <span className={`text-xs font-bold truncate text-right ${awayIsFlu ? 'text-[#722F37]' : 'text-stone-800'}`}>
                          {awayTeam}
                        </span>
                        <img
                          src={awayLogo}
                          alt={awayTeam}
                          className="w-8 h-8 object-contain shrink-0 bg-stone-200/60 rounded-full p-1"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-200/60">
                      <span>{match.competition}</span>
                      <span>📍 {match.location || 'Maracanã'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SELECTED MATCH DETAIL MODAL */}
      {selectedMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#5a0c1a] via-[#722F37] to-[#004d26] text-white p-5 border-b-4 border-[#e6b800]">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e6b800] text-[#5a0c1a]">
                  {selectedMatch.competition}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedMatch.isHome ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                }`}>
                  {selectedMatch.isHome ? '🏠 Fluminense Mandante' : '✈️ Fluminense Visitante'}
                </span>
              </div>

              {/* Match teams */}
              {(() => {
                const { homeTeam, homeLogo, homeIsFlu, awayTeam, awayLogo, awayIsFlu } = formatMatchTeams(selectedMatch);
                return (
                  <div className="flex items-center justify-between gap-3 py-2">
                    <div className="flex items-center gap-2">
                      <img src={homeLogo} alt={homeTeam} className="w-10 h-10 object-contain bg-white/20 rounded-full p-1" />
                      <span className={`text-base font-black font-serif ${homeIsFlu ? 'text-white' : 'text-amber-100'}`}>
                        {homeTeam}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-[#e6b800]">VS</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black font-serif ${awayIsFlu ? 'text-white' : 'text-amber-100'}`}>
                        {awayTeam}
                      </span>
                      <img src={awayLogo} alt={awayTeam} className="w-10 h-10 object-contain bg-white/20 rounded-full p-1" />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Details Body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-400 block mb-0.5">Data do Jogo</span>
                  <span className="font-bold text-stone-800 text-sm">
                    {selectedMatch.date ? selectedMatch.date.split('-').reverse().join('/') : 'A definir'}
                  </span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-400 block mb-0.5">Horário</span>
                  <span className="font-bold text-stone-800 text-sm">{selectedMatch.time || '16:00'} hrs</span>
                </div>
              </div>

              {selectedMatch.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 italic">
                  "{selectedMatch.notes}"
                </div>
              )}

              {/* Action for Home Matches */}
              {selectedMatch.isHome ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                  <p className="font-bold">🏠 Fluminense é Mandante nesta partida!</p>
                  <p className="text-[11px] text-emerald-800">
                    Este jogo aparece na sua tela principal para você gerenciar o checklist de tarefas.
                  </p>
                  {onOpenTasks && (
                    <button
                      onClick={() => {
                        const m = selectedMatch;
                        setSelectedMatch(null);
                        onOpenTasks(m);
                      }}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow transition-colors cursor-pointer"
                    >
                      📋 Abrir Checklist de Tarefas
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-xs text-stone-600">
                  ℹ️ <strong>Fluminense é Visitante:</strong> Jogos como visitante não exigem trabalho presencial e não aparecem na tela principal de tarefas.
                </div>
              )}
            </div>

            <div className="bg-stone-50 p-4 border-t border-stone-200 text-right">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
