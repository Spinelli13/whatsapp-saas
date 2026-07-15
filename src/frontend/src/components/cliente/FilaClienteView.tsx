import { useEffect, useState, useCallback } from 'react';
import { useSocketEvent } from '../../hooks/useSocket';

interface Ticket {
  id: string;
  texto: string;
  status: string;
  criado_em: string;
  respondido_em?: string;
  cliente_id?: number;
}

interface FilaClienteViewProps {
  clienteId: number;
}

const STATUS_COLORS: Record<string, string> = {
  resolvido: 'bg-green-500',
  respondendo: 'bg-yellow-500',
  novo: 'bg-blue-500',
};

export function FilaClienteView({ clienteId }: FilaClienteViewProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useSocketEvent<Ticket>(
    'nova_mensagem_recebida',
    useCallback(
      (data) => {
        if (data.cliente_id === clienteId) {
          setTickets((prev) => [data, ...prev]);
        }
      },
      [clienteId]
    )
  );

  useSocketEvent<{ ticket_id: string; novo_status: string; respondido_em?: string }>(
    'ticket_status_changed',
    useCallback((data) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === data.ticket_id
            ? { ...t, status: data.novo_status, respondido_em: data.respondido_em }
            : t
        )
      );
    }, [])
  );

  useEffect(() => {
    // Mock inicial — substituir por chamada real à API
    setTickets([
      {
        id: '1',
        texto: 'Olá, tudo bem?',
        status: 'resolvido',
        criado_em: new Date().toISOString(),
        respondido_em: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  }, [clienteId]);

  if (loading) return <div className="text-center py-4 text-gray-500">Carregando...</div>;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4">📋 Minhas Conversas</h2>

      {tickets.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Nenhuma conversa ainda</p>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-3 bg-gray-50 rounded border border-gray-200"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium text-sm">{ticket.texto}</p>
                <span
                  className={`text-xs px-2 py-1 rounded text-white ${
                    STATUS_COLORS[ticket.status] || 'bg-gray-500'
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(ticket.criado_em).toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
