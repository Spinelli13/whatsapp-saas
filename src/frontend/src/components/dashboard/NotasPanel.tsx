import { useState } from 'react';
import { Button } from '../ui/Button';

interface Nota {
  id: string;
  texto: string;
  criado_em: string;
  usuario_nome: string;
}

interface NotasPanelProps {
  ticketId: string | null;
}

export function NotasPanel({ ticketId }: NotasPanelProps) {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [texto, setTexto] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSalvar() {
    if (!texto.trim() || !ticketId) return;
    setSaving(true);
    try {
      const nova: Nota = {
        id: `nota-${Date.now()}`,
        texto: texto.trim(),
        criado_em: new Date().toISOString(),
        usuario_nome: 'Você',
      };
      setNotas((prev) => [nova, ...prev]);
      setTexto('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Notas Internas</h2>
      </div>

      <div className="p-4">
        {ticketId ? (
          <>
            <div className="mb-3">
              <textarea
                className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                rows={3}
                placeholder="Adicionar nota interna..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
              <Button
                size="sm"
                onClick={handleSalvar}
                loading={saving}
                disabled={!texto.trim()}
                className="mt-2"
              >
                Salvar Nota
              </Button>
            </div>

            {notas.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma nota para este ticket</p>
            ) : (
              <ul className="space-y-2">
                {notas.map((nota) => (
                  <li key={nota.id} className="bg-yellow-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-800">{nota.texto}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {nota.usuario_nome} • {new Date(nota.criado_em).toLocaleString('pt-BR')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            Selecione um ticket para ver as notas
          </p>
        )}
      </div>
    </div>
  );
}
