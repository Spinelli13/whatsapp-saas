import { useEffect, useState } from 'react';

interface Nota {
  id: string;
  ticket_id: string;
  conteudo: string;
  criado_em: string;
}

interface MinhasNotasProps {
  clienteId: number;
}

export function MinhasNotas({ clienteId: _clienteId }: MinhasNotasProps) {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: carregar notas públicas via API
    setNotas([]);
    setLoading(false);
  }, [_clienteId]);

  if (loading) return <div className="text-center py-4 text-gray-500">Carregando...</div>;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4">📝 Notas sobre Minhas Conversas</h2>

      {notas.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Sem notas no momento</p>
      ) : (
        <div className="space-y-3">
          {notas.map((nota) => (
            <div key={nota.id} className="p-3 bg-gray-50 rounded">
              <p className="text-sm font-medium mb-1">{nota.conteudo}</p>
              <p className="text-xs text-gray-500">
                {new Date(nota.criado_em).toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
