import { useState } from 'react';
import { Trash2, Send, StickyNote } from 'lucide-react';
import { useNotasInternas } from '../../hooks/useNotasInternas';
import { useAuthStore } from '../../store/authStore';

interface Props {
  atendimentoId: string;
  isDark: boolean;
}

function tempoRelativo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff}m atrás`;
  return `${Math.floor(diff / 60)}h atrás`;
}

export default function PainelNotasInternas({ atendimentoId, isDark }: Props) {
  const usuario = useAuthStore((s) => s.usuario);
  const { notas, criar, deletar, loading } = useNotasInternas(atendimentoId);
  const [texto, setTexto] = useState('');
  const [deletando, setDeletando] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const handleCriar = async () => {
    if (!texto.trim() || salvando) return;
    try {
      setSalvando(true);
      await criar(texto.trim());
      setTexto('');
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar nota');
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (notaId: string) => {
    if (!window.confirm('Remover esta nota?')) return;
    try {
      setDeletando(notaId);
      await deletar(notaId);
    } catch (err: any) {
      alert(err.message || 'Erro ao deletar nota');
    } finally {
      setDeletando(null);
    }
  };

  return (
    <div className={`flex flex-col border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
      {/* Header */}
      <div className={`px-4 py-2.5 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <StickyNote className={`h-3.5 w-3.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
          <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            Notas Internas
          </span>
        </div>
      </div>

      {/* Lista */}
      <div className="max-h-48 overflow-y-auto px-3 py-2 space-y-2">
        {loading ? (
          <p className={`text-xs text-center py-2 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
            Carregando...
          </p>
        ) : notas.length === 0 ? (
          <p className={`text-xs text-center py-2 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
            Nenhuma nota ainda
          </p>
        ) : (
          notas.map((nota) => (
            <div
              key={nota.id}
              className={`p-2.5 rounded-lg text-xs border-l-2 border-amber-400/60 ${
                isDark ? 'bg-slate-800/60' : 'bg-amber-50/60'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className={`font-semibold truncate ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {nota.autor?.nome || 'Anônimo'}
                </span>
                {usuario?.id === nota.usuario_id && (
                  <button
                    onClick={() => handleDeletar(nota.id)}
                    disabled={deletando === nota.id}
                    className="flex-shrink-0 text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
                    title="Deletar nota"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {nota.conteudo}
              </p>
              <p className={`mt-1 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                {tempoRelativo(nota.criado_em)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className={`px-3 py-2.5 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex gap-1.5">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCriar();
              }
            }}
            placeholder="Nota interna (não vai ao cliente)..."
            rows={2}
            className={`flex-1 px-2.5 py-1.5 rounded text-xs border resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500 transition-all ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-600'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
          <button
            onClick={handleCriar}
            disabled={!texto.trim() || salvando}
            className="flex-shrink-0 px-2 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Salvar nota"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
