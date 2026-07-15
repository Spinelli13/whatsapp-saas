import { useState, useEffect, useCallback } from 'react';

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

const ACAO_ICONS: Record<string, string> = {
  criado: '🆕',
  status_alterado: '🔄',
  nota_adicionada: '📝',
  atribuido: '👤',
  fechado: '✅',
};

export function HistoricoTimeline({ ticketId }: HistoricoTimelineProps) {
  const [entries, setEntries] = useState<HistoricoEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistorico = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      // Mock data — substituir por chamada real à API
      setEntries([
        {
          id: 'h1',
          acao: 'criado',
          dados_novos: null,
          criado_em: new Date(Date.now() - 120 * 60000).toISOString(),
          usuario_nome: null,
        },
        {
          id: 'h2',
          acao: 'atribuido',
          dados_novos: { atendente: 'Ana Costa' },
          criado_em: new Date(Date.now() - 60 * 60000).toISOString(),
          usuario_nome: 'Sistema',
        },
        {
          id: 'h3',
          acao: 'status_alterado',
          dados_novos: { ticket_status: 'respondendo' },
          criado_em: new Date(Date.now() - 30 * 60000).toISOString(),
          usuario_nome: 'Ana Costa',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadHistorico();
  }, [loadHistorico]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Histórico</h2>
      </div>

      <div className="p-4">
        {!ticketId ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Selecione um ticket para ver o histórico
          </p>
        ) : loading ? (
          <p className="text-sm text-gray-400 text-center py-4">Carregando...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sem histórico</p>
        ) : (
          <ol className="relative border-l border-gray-200 ml-3 space-y-4">
            {entries.map((entry) => (
              <li key={entry.id} className="ml-4">
                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-50 text-sm">
                  {ACAO_ICONS[entry.acao] || '•'}
                </span>
                <p className="text-sm font-medium text-gray-800">
                  {ACAO_LABELS[entry.acao] || entry.acao}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {entry.usuario_nome && <span>{entry.usuario_nome} • </span>}
                  {new Date(entry.criado_em).toLocaleString('pt-BR')}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
