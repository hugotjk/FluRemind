import React, { useState } from 'react';
import { Calendar, Clock, CheckSquare, Plus, Send, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Match } from '../types';
import { formatMatchTeams } from '../utils/teamLogos';

interface MatchCardProps {
  match: Match;
  onDelete: (id: string) => void;
  onToggleTask: (matchId: string, taskId: string, completed: boolean) => void;
  onAddTask: (matchId: string, text: string) => void;
  onDeleteTask: (matchId: string, taskId: string) => void;
  onNotifyMatch: (match: Match) => void;
  onOpenChecklist?: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onDelete,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onNotifyMatch,
  onOpenChecklist
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [newTaskText, setNewTaskText] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const tasks = match.tasks || [];
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = match.date === todayStr;

  const handleAddNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setIsSubmittingTask(true);
    await onAddTask(match.id, newTaskText.trim());
    setNewTaskText('');
    setIsSubmittingTask(false);
  };

  const getCompColor = (comp: string) => {
    switch (comp) {
      case 'Copa Libertadores':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Brasileirão':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Copa do Brasil':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'Campeonato Carioca':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md overflow-hidden ${
      isToday ? 'ring-2 ring-[#722F37] border-[#722F37]/40 bg-stone-50/50' : 'border-stone-200'
    }`}>
      
      {/* Top Card Header */}
      <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/80">
        <div className="flex items-start justify-between gap-3">
          
          {(() => {
            const { homeTeam, homeLogo, homeIsFlu, awayTeam, awayLogo, awayIsFlu } = formatMatchTeams(match);
            return (
              <div className="space-y-1.5 max-w-full flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {isToday && (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-rose-600 text-white animate-pulse">
                      🔥 É HOJE
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getCompColor(match.competition)}`}>
                    {match.competition}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-stone-200 text-stone-700">
                    {match.isHome ? '🏠 Casa' : '✈️ Fora'}
                  </span>
                </div>

                {/* Team Matchup - Mandante (Foto à Esquerda), Visitante (Foto à Direita) */}
                <div className="flex items-center justify-between gap-2 pt-1 text-stone-900 leading-tight">
                  {/* Mandante */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <img
                      src={homeLogo}
                      alt={homeTeam}
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <span className={`text-sm sm:text-base font-black font-serif truncate ${homeIsFlu ? 'text-[#722F37]' : 'text-stone-800'}`}>
                      {homeTeam}
                    </span>
                  </div>

                  <span className="text-xs font-black text-[#e6b800] bg-stone-900 px-2 py-0.5 rounded shrink-0">VS</span>

                  {/* Visitante */}
                  <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0 text-right">
                    <span className={`text-sm sm:text-base font-black font-serif truncate ${awayIsFlu ? 'text-[#722F37]' : 'text-stone-800'}`}>
                      {awayTeam}
                    </span>
                    <img
                      src={awayLogo}
                      alt={awayTeam}
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onNotifyMatch(match)}
              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
              title="Notificar este jogo via Telegram"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Telegram</span>
            </button>
          </div>

        </div>

        {/* Info pills - Data e Horário (SEM Local/Estádio) */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mt-3 pt-2 border-t border-stone-200/60">
          <div className="flex items-center gap-1 font-semibold text-stone-900">
            <Calendar className="w-3.5 h-3.5 text-[#722F37]" />
            <span>{match.date ? match.date.split('-').reverse().join('/') : 'Data a definir'}</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-stone-900">
            <Clock className="w-3.5 h-3.5 text-[#722F37]" />
            <span>{match.time || '16:00'} hrs</span>
          </div>
        </div>

        {match.notes && (
          <p className="text-xs text-stone-500 mt-2 bg-stone-100 p-2 rounded-lg italic">
            {match.notes}
          </p>
        )}
      </div>

      {/* Progress & Checklist Accordion Header */}
      <div className="p-4 bg-white">
        <div className="flex items-center justify-between gap-2 mb-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs font-bold text-stone-800 hover:text-[#722F37] transition-colors"
          >
            <CheckSquare className="w-4 h-4 text-[#006633]" />
            <span>Checklist de Lembretes ({completedTasks}/{totalTasks})</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
          </button>

          <span className="text-xs font-bold text-stone-500">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden mb-3">
          <div
            className="bg-gradient-to-r from-[#006633] to-[#722F37] h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Task Checklist Items */}
        {expanded && (
          <div className="space-y-2 mt-3 pt-2 border-t border-stone-100">
            {totalTasks === 0 ? (
              <p className="text-xs text-stone-400 italic py-1 text-center">
                Nenhuma tarefa cadastrada ainda. Adicione abaixo!
              </p>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                    task.completed ? 'bg-emerald-50/60 text-stone-500 line-through' : 'bg-stone-50 text-stone-800 font-medium hover:bg-stone-100'
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => onToggleTask(match.id, task.id, e.target.checked)}
                      className="w-4 h-4 rounded text-[#006633] focus:ring-[#006633] border-stone-300"
                    />
                    <span className="truncate">{task.text}</span>
                  </label>

                  <button
                    onClick={() => onDeleteTask(match.id, task.id)}
                    className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                    title="Excluir tarefa"
                  >
                    ×
                  </button>
                </div>
              ))
            )}

            {/* Quick Task Add Input Form */}
            <form onSubmit={handleAddNewTask} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="+ Adicionar tarefa para este jogo..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#006633]"
              />
              <button
                type="submit"
                disabled={!newTaskText.trim() || isSubmittingTask}
                className="px-3 py-1.5 bg-[#006633] hover:bg-[#004d26] disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
