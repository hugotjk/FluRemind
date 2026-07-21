import React, { useState, useEffect } from 'react';
import { X, Plus, Shield, Calendar, Clock, MapPin, CheckSquare, Sparkles } from 'lucide-react';
import { Match, Competition } from '../types';
import { PRESET_TASKS } from '../data/initialData';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (matchData: Partial<Match>) => void;
  initialData?: Match | null;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('16:00');
  const [competition, setCompetition] = useState<Competition>('Brasileirão');
  const [location, setLocation] = useState('Maracanã, Rio de Janeiro');
  const [isHome, setIsHome] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([
    PRESET_TASKS[0], // Camisa tricolor
    PRESET_TASKS[1], // Ingressos / checkin
    PRESET_TASKS[3]  // Horario de saida
  ]);

  useEffect(() => {
    if (initialData) {
      setOpponent(initialData.opponent);
      setDate(initialData.date);
      setTime(initialData.time);
      setCompetition(initialData.competition);
      setLocation(initialData.location);
      setIsHome(initialData.isHome);
      setNotes(initialData.notes || '');
      setSelectedPresets([]);
    } else {
      setOpponent('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('16:00');
      setCompetition('Brasileirão');
      setLocation('Maracanã, Rio de Janeiro');
      setIsHome(true);
      setNotes('');
      setSelectedPresets([PRESET_TASKS[0], PRESET_TASKS[1], PRESET_TASKS[3]]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponent.trim()) return;

    const initialTasks = selectedPresets.map((text, idx) => ({
      id: `task-init-${idx}-${Date.now()}`,
      text,
      completed: false
    }));

    onSave({
      opponent: opponent.trim(),
      date,
      time,
      competition,
      location,
      isHome,
      notes: notes.trim(),
      ...(initialData ? {} : { tasks: initialTasks })
    });

    onClose();
  };

  const togglePreset = (preset: string) => {
    if (selectedPresets.includes(preset)) {
      setSelectedPresets(selectedPresets.filter(p => p !== preset));
    } else {
      setSelectedPresets([...selectedPresets, preset]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-stone-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#5a0c1a] to-[#004d26] text-white p-5 flex items-center justify-between border-b-2 border-[#e6b800]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇭🇺</span>
            <div>
              <h2 className="text-lg font-black font-serif">
                {initialData ? 'Editar Jogo do Fluminense' : 'Cadastrar Novo Jogo'}
              </h2>
              <p className="text-xs text-stone-200">
                Preencha os detalhes e selecione as tarefas padrão
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Opponent */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              Adversário <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Flamengo, River Plate, Botafogo..."
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#722F37] font-semibold"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#722F37]" /> Data do Jogo
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#722F37]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#722F37]" /> Horário
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#722F37]"
              />
            </div>
          </div>

          {/* Competition & Home/Away */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Campeonato
              </label>
              <select
                value={competition}
                onChange={(e) => setCompetition(e.target.value as Competition)}
                className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#722F37] font-medium"
              >
                <option value="Brasileirão">Brasileirão</option>
                <option value="Copa Libertadores">Copa Libertadores</option>
                <option value="Copa do Brasil">Copa do Brasil</option>
                <option value="Campeonato Carioca">Campeonato Carioca</option>
                <option value="Supercopa do Brasil">Supercopa do Brasil</option>
                <option value="Amistoso">Amistoso</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Mando de Campo
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsHome(true);
                    if (location === 'Fora de Casa') setLocation('Maracanã, Rio de Janeiro');
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    isHome ? 'bg-[#006633] text-white shadow' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  🏠 Casa
                </button>
                <button
                  type="button"
                  onClick={() => setIsHome(false)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    !isHome ? 'bg-[#722F37] text-white shadow' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  ✈️ Fora
                </button>
              </div>
            </div>
          </div>

          {/* Location / Stadium */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#722F37]" /> Estádio / Local
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Maracanã, Rio de Janeiro"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#722F37]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              Observações / Dicas de Ingressos
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Ponto de encontro na Rampa do Metrô às 14h..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#722F37]"
            />
          </div>

          {/* Preset Tasks Checkboxes (only for new games) */}
          {!initialData && (
            <div className="pt-2 border-t border-stone-200">
              <label className="block text-xs font-bold text-stone-800 uppercase mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#e6b800]" />
                Checklist Tricolor Padrão (Selecione):
              </label>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {PRESET_TASKS.map((preset, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors border ${
                      selectedPresets.includes(preset)
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPresets.includes(preset)}
                      onChange={() => togglePreset(preset)}
                      className="rounded text-[#006633] focus:ring-[#006633]"
                    />
                    <span>{preset}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#722F37] to-[#006633] hover:opacity-95 text-white text-xs font-bold shadow-lg transition-all"
            >
              {initialData ? 'Salvar Alterações' : 'Cadastrar Jogo 🇭🇺'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
