import { useEffect, useState } from 'react';

interface Evento {
  id: string;
  acao: string;
  criado_em: string;
  descricao: string;
}

interface MeuHistoricoProps {
  clienteId: number;
}

export function MeuHistorico({ clienteId: _clienteId }: MeuHistoricoProps) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: carregar histórico público via API
    setEventos([
      {
        id: '1',
        acao: 'ticket_criado',
        criado_em: new Date().toISOString(),
        descricao: 'Sua mensagem foi recebida',
      },
      {
        id: '2',
        acao: 'ticket_respondido',
        criado_em: new Date(Date.now() - 3600000).toISOString(),
        descricao: 'Sua conversa foi respondida',
      },
    ]);
    setLoading(false);
  }, [_clienteId]);

  if (loading) return <div className="text-center py-4 text-gray-500">Carregando...</div>;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4">📜 Histórico de Eventos</h2>

      <div className="space-y-4">
        {eventos.map((evento, idx) => (
          <div key={evento.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" />
              {idx < eventos.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-300 mt-1" />
              )}
            </div>
            <div className="pb-4">
              <p className="font-medium text-sm">{evento.descricao}</p>
              <p className="text-xs text-gray-500">
                {new Date(evento.criado_em).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
