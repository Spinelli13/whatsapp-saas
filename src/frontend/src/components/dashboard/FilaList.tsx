import { useState, useEffect, useCallback } from 'react';
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
  novo: 'Aguardando atendimento',
  respondendo: 'Em atendimento',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
};

const STATUS_COLORS: Record<string, string> = {
  novo: 'bg-yellow-100 text-yellow-800',
  respondendo: 'bg-blue-100 text-blue-800',
  resolvido: 'bg-green-100 text-green-800',
  fechado: 'bg-gray-100 text-gray-700',
};

export function FilaList({ clienteId: _clienteId, departamentoId: _departamentoId }: FilaListProps) {
  const [tickets, setTickets] = useState<TicketFila[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFila = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data — substituir por chamada real à API em fase posterior
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

  useEffect(() => {
    loadFila();
  }, [loadFila]);

  useSocketEvent<{ ticket_id: string; telefone: string; acao: string }>(
    'fila_atualizada',
    useCallback(
      (data) => {
        if (data.acao === 'na_fila') {
          setTickets((prev) => [
            ...prev,
            {
              id: data.ticket_id,
              telefone: data.telefone,
              mensagem_inicial: '',
              ticket_status: 'novo',
              criado_em: new Date().toISOString(),
            },
          ]);
        }
      },
      []
    )
  );

  useSocketEvent<{ ticket_id: string; novo_status: string }>(
    'ticket_status_changed',
    useCallback(
      (data) => {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === data.ticket_id ? { ...t, ticket_status: data.novo_status } : t
          )
        );
      },
      []
    )
  );

  function formatTime(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'agora';
    if (diff === 1) return '1 min atrás';
    return `${diff} min atrás`;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Fila de Mensagens</h2>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
      ) : tickets.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">Fila vazia</div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {ticket.telefone}
                  </p>
                  {ticket.mensagem_inicial && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {ticket.mensagem_inicial}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      STATUS_COLORS[ticket.ticket_status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {STATUS_LABELS[ticket.ticket_status] || ticket.ticket_status}
                  </span>
                  <span className="text-xs text-gray-400">{formatTime(ticket.criado_em)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
