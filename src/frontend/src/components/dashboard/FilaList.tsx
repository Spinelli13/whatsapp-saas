import { useState, useEffect, useCallback } from 'react';
import { Clock, MessageCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useSocketEvent } from '../../hooks/useSocket';

interface TicketFila {
  id: string;
  telefone: string;
  mensagem_inicial: string;
  ticket_status: string;
  criado_em: string;
}

interface FilaListProps {
  clienteId: number;
  departamentoId?: number;
}

const STATUS_LABELS: Record<string, string> = {
  novo: 'Aguardando',
  respondendo: 'Em atendimento',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
};

const STATUS_CONFIG: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
  novo: { Icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  respondendo: { Icon: MessageCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  resolvido: { Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  fechado: { Icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-800 border-slate-700' },
};

export function FilaList({ clienteId: _clienteId, departamentoId: _departamentoId }: FilaListProps) {
  const [tickets, setTickets] = useState<TicketFila[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFila = useCallback(async () => {
    try {
      setLoading(true);
      setTickets([
        {
          id: 'aaa00001-0001-4001-8001-000000000001',
          telefone: '5585990000001',
          mensagem_inicial: 'Olá, preciso de ajuda',
          ticket_status: 'novo',
          criado_em: new Date(Date.now() - 10 * 60000).toISOString(),
        },
        {
          id: 'aaa00001-0001-4001-8001-000000000002',
          telefone: '5585990000002',
          mensagem_inicial: 'Meu pedido não chegou',
          ticket_status: 'respondendo',
          criado_em: new Date(Date.now() - 25 * 60000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFila(); }, [loadFila]);

  useSocketEvent<{ ticket_id: string; telefone: string; acao: string }>(
    'fila_atualizada',
    useCallback((data) => {
      if (data.acao === 'na_fila') {
        setTickets((prev) => [
          ...prev,
          { id: data.ticket_id, telefone: data.telefone, mensagem_inicial: '', ticket_status: 'novo', criado_em: new Date().toISOString() },
        ]);
      }
    }, [])
  );

  useSocketEvent<{ ticket_id: string; novo_status: string }>(
    'ticket_status_changed',
    useCallback((data) => {
      setTickets((prev) =>
        prev.map((t) => t.id === data.ticket_id ? { ...t, ticket_status: data.novo_status } : t)
      );
    }, [])
  );

  function formatTime(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'agora';
    if (diff === 1) return '1 min atrás';
    return `${diff} min atrás`;
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <h2 className="font-semibold text-slate-100">Fila de Mensagens</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-full">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={loadFila}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Carregando...</div>
      ) : tickets.length === 0 ? (
        <div className="p-8 text-center">
          <MessageCircle className="h-8 w-8 text-slate-700 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Fila vazia</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800/60">
          {tickets.map((ticket) => {
            const cfg = STATUS_CONFIG[ticket.ticket_status] || STATUS_CONFIG.fechado;
            return (
              <li key={ticket.id} className="px-5 py-3.5 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{ticket.telefone}</p>
                    {ticket.mensagem_inicial && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{ticket.mensagem_inicial}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cfg.bg}`}>
                      <cfg.Icon className={`h-3 w-3 ${cfg.color}`} />
                      <span className={cfg.color}>{STATUS_LABELS[ticket.ticket_status] || ticket.ticket_status}</span>
                    </span>
                    <span className="text-xs text-slate-600">{formatTime(ticket.criado_em)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
