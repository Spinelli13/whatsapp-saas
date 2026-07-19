import { useState } from 'react';
import { StickyNote, Send } from 'lucide-react';
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
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-amber-400" />
        <h2 className="font-semibold text-slate-100">Notas Internas</h2>
      </div>

      <div className="p-4">
        {ticketId ? (
          <>
            <div className="mb-3">
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200
                  placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500
                  transition-all duration-200"
                rows={3}
                placeholder="Adicionar nota interna..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
              <Button
                size="sm"
                icon={Send}
                onClick={handleSalvar}
                loading={saving}
                disabled={!texto.trim()}
                className="mt-2"
              >
                Salvar Nota
              </Button>
            </div>

            {notas.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-3">Nenhuma nota para este ticket</p>
            ) : (
              <ul className="space-y-2">
                {notas.map((nota) => (
                  <li key={nota.id} className="bg-amber-900/10 border border-amber-800/20 rounded-lg p-3 text-sm">
                    <p className="text-slate-200">{nota.texto}</p>
                    <p className="text-xs text-slate-500 mt-1.5">
                      {nota.usuario_nome} · {new Date(nota.criado_em).toLocaleString('pt-BR')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-600 text-center py-4">
            Selecione um ticket para ver as notas
          </p>
        )}
      </div>
    </div>
  );
}
