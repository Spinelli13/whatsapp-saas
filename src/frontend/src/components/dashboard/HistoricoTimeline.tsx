import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, FileText, User, CheckCircle2, History } from 'lucide-react';

interface HistoricoEntry {
  id: string;
  acao: string;
  dados_novos: Record<string, unknown> | null;
  criado_em: string;
  usuario_nome: string | null;
}

interface HistoricoTimelineProps {
  ticketId: string | null;
}

const ACAO_LABELS: Record<string, string> = {
  criado: 'Ticket criado',
  status_alterado: 'Status alterado',
  nota_adicionada: 'Nota adicionada',
  atribuido: 'Atribuído a atendente',
  fechado: 'Ticket fechado',
};

const ACAO_ICONS: Record<string, { Icon: React.ElementType; color: string }> = {
  criado: { Icon: Plus, color: 'text-cyan-400' },
  status_alterado: { Icon: RefreshCw, color: 'text-amber-400' },
  nota_adicionada: { Icon: FileText, color: 'text-purple-400' },
  atribuido: { Icon: User, color: 'text-blue-400' },
  fechado: { Icon: CheckCircle2, color: 'text-emerald-400' },
};

export function HistoricoTimeline({ ticketId }: HistoricoTimelineProps) {
  const [entries, setEntries] = useState<HistoricoEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistorico = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      setEntries([
        { id: 'h1', acao: 'criado', dados_novos: null, criado_em: new Date(Date.now() - 120 * 60000).toISOString(), usuario_nome: null },
        { id: 'h2', acao: 'atribuido', dados_novos: { atendente: 'Ana Costa' }, criado_em: new Date(Date.now() - 60 * 60000).toISOString(), usuario_nome: 'Sistema' },
        { id: 'h3', acao: 'status_alterado', dados_novos: { ticket_status: 'respondendo' }, criado_em: new Date(Date.now() - 30 * 60000).toISOString(), usuario_nome: 'Ana Costa' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { loadHistorico(); }, [loadHistorico]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
        <History className="h-4 w-4 text-slate-400" />
        <h2 className="font-semibold text-slate-100">Histórico</h2>
      </div>

      <div className="p-4">
        {!ticketId ? (
          <p className="text-sm text-slate-600 text-center py-4">
            Selecione um ticket para ver o histórico
          </p>
        ) : loading ? (
          <p className="text-sm text-slate-600 text-center py-4">Carregando...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">Sem histórico</p>
        ) : (
          <ol className="relative border-l border-slate-800 ml-3 space-y-4">
            {entries.map((entry) => {
              const cfg = ACAO_ICONS[entry.acao] || { Icon: RefreshCw, color: 'text-slate-500' };
              return (
                <li key={entry.id} className="ml-4">
                  <span className="absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
                    <cfg.Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                  </span>
                  <p className="text-sm font-medium text-slate-200">
                    {ACAO_LABELS[entry.acao] || entry.acao}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {entry.usuario_nome && <span className="text-slate-400">{entry.usuario_nome} · </span>}
                    {new Date(entry.criado_em).toLocaleString('pt-BR')}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
