import React, { useState } from 'react';
import { X, CheckSquare, Plus, Trash2, Calendar, Clock, Shield } from 'lucide-react';
import { Match } from '../types';
import { formatMatchTeams } from '../utils/teamLogos';

interface MatchTasksModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleTask: (matchId: string, taskId: string, completed: boolean) => void;
  onAddTask: (matchId: string, text: string) => void;
  onDeleteTask: (matchId: string, taskId: string) => void;
}

export const MatchTasksModal: React.FC<MatchTasksModalProps> = ({
  match,
  isOpen,
  onClose,
  onToggleTask,
  onAddTask,
  onDeleteTask
}) => {
  const [newTaskText, setNewTaskText] = useState('');

  if (!isOpen || !match) return null;

  const tasks = match.tasks || [];
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const { homeTeam, homeLogo, homeIsFlu, awayTeam, awayLogo, awayIsFlu } = formatMatchTeams(match);

  const handleAddNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    await onAddTask(match.id, newTaskText.trim());
    setNewTaskText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#722F37] to-[#006633] p-5 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-200 block">
              {match.competition} • {match.isHome ? 'Casa' : 'Fora'}
            </span>
            <h3 className="text-lg font-bold font-serif flex items-center gap-2 mt-0.5">
              <span>📋 Tarefas do Jogo</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match Details Banner */}
        <div className="bg-stone-50 border-b border-stone-200 p-4">
          <div className="flex items-center justify-between gap-2">
            {/* Mandante */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img
                src={homeLogo}
                alt={homeTeam}
                className="w-7 h-7 object-contain shrink-0"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <span className={`text-sm font-black truncate ${homeIsFlu ? 'text-[#722F37]' : 'text-stone-800'}`}>
                {homeTeam}
              </span>
            </div>

            <span className="text-xs font-black text-[#e6b800] bg-stone-900 px-2 py-0.5 rounded">VS</span>

            {/* Visitante */}
            <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
              <span className={`text-sm font-black truncate ${awayIsFlu ? 'text-[#722F37]' : 'text-stone-800'}`}>
                {awayTeam}
              </span>
              <img
                src={awayLogo}
                alt={awayTeam}
                className="w-7 h-7 object-contain shrink-0"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-600 mt-2 pt-2 border-t border-stone-200/60 justify-center">
            <div className="flex items-center gap-1 font-semibold text-stone-900">
              <Calendar className="w-3.5 h-3.5 text-[#722F37]" />
              <span>{match.date ? match.date.split('-').reverse().join('/') : ''}</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-stone-900">
              <Clock className="w-3.5 h-3.5 text-[#722F37]" />
              <span>{match.time || '16:00'} hrs</span>
            </div>
          </div>
        </div>

        {/* Checklist Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-[#006633]" />
              Checklist de Lembretes ({completedTasks}/{totalTasks})
            </h4>
            <span className="text-xs font-bold text-[#006633]">
              {progressPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#006633] to-[#722F37] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* List of Tasks */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {totalTasks === 0 ? (
              <div className="text-center py-6 text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200 space-y-1">
                <Shield className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-medium">Nenhuma tarefa cadastrada para este jogo.</p>
                <p className="text-[11px] text-stone-400">Adicione uma tarefa abaixo para começar!</p>
              </div>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                    task.completed
                      ? 'bg-emerald-50/50 border-emerald-200 text-stone-400 line-through'
                      : 'bg-white border-stone-200 text-stone-800 font-medium hover:border-stone-300'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2">
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
                    className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add New Task Form */}
          <form onSubmit={handleAddNewTask} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Digite uma nova tarefa para este jogo..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#006633] font-medium"
            />
            <button
              type="submit"
              disabled={!newTaskText.trim()}
              className="px-4 py-2.5 bg-[#006633] hover:bg-[#004d26] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
