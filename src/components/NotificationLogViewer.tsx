import React from 'react';
import { Terminal, CheckCircle2, XCircle, Trash2, Calendar, Send } from 'lucide-react';
import { NotificationLog } from '../types';

interface NotificationLogViewerProps {
  logs: NotificationLog[];
  onClearLogs: () => void;
}

export const NotificationLogViewer: React.FC<NotificationLogViewerProps> = ({
  logs,
  onClearLogs
}) => {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-sm">
        <Terminal className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-stone-800">Nenhum histórico de envio registrado</h3>
        <p className="text-xs text-stone-500 mt-1">
          Dispare um envio de teste ou execute o Vercel Cron para visualizar o registro de notificações enviadas.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-4">
      
      <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold tracking-tight font-mono">
            Histórico de Notificações Telegram ({logs.length})
          </h2>
        </div>

        <button
          onClick={onClearLogs}
          className="text-xs text-stone-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Limpar Histórico</span>
        </button>
      </div>

      <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="p-4 hover:bg-stone-50 transition-colors text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {log.success ? (
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sucesso
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full font-bold">
                    <XCircle className="w-3.5 h-3.5" /> Falha
                  </span>
                )}

                <span className="font-mono text-stone-500 text-[11px]">
                  Tipo: {log.type === 'cron' ? '⏰ Vercel Cron' : '⚡ Envio Manual'}
                </span>

                {log.opponent && (
                  <span className="font-bold text-stone-800 bg-stone-200 px-2 py-0.5 rounded">
                    Fluminense vs {log.opponent}
                  </span>
                )}
              </div>

              <span className="text-stone-400 font-mono text-[11px]">
                {new Date(log.timestamp).toLocaleString('pt-BR')}
              </span>
            </div>

            {log.error ? (
              <p className="text-rose-600 bg-rose-50 p-2 rounded border border-rose-200 font-mono text-[11px]">
                Erro: {log.error}
              </p>
            ) : (
              <div className="bg-stone-900 text-stone-200 p-3 rounded-xl font-mono text-[11px] whitespace-pre-wrap leading-relaxed border border-stone-800">
                {log.message}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
