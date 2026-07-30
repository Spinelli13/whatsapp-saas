import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Zap } from 'lucide-react';
import type { RespostaRapida } from '../../hooks/useRespostasRapidas';

interface Props {
  respostas: RespostaRapida[];
  onSelect: (conteudo: string) => void;
  loading?: boolean;
  inputValue?: string;
  isDark?: boolean;
}

export default function RespostaRapidaDropdown({
  respostas,
  onSelect,
  loading = false,
  inputValue = '',
  isDark = true,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Abre automaticamente se usuário digitou "/"
  const filtradas = inputValue.startsWith('/')
    ? respostas.filter((r) => r.atalho?.toLowerCase().startsWith(inputValue.toLowerCase()))
    : respostas;

  const autoOpen = inputValue.startsWith('/') && filtradas.length > 0;

  useEffect(() => {
    if (autoOpen) setAberto(true);
    else if (!inputValue.startsWith('/')) setAberto(false);
  }, [autoOpen, inputValue]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSelect = (r: RespostaRapida) => {
    onSelect(r.conteudo);
    setAberto(false);
  };

  const menuBg  = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const itemHov = isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50';
  const textSub = isDark ? 'text-slate-400' : 'text-gray-500';
  const textPre = isDark ? 'text-slate-200' : 'text-gray-800';
  const btnBase = isDark
    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300';

  return (
    <div ref={dropdownRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        disabled={loading || respostas.length === 0}
        title={respostas.length === 0 ? 'Nenhuma resposta rápida cadastrada' : 'Respostas rápidas'}
        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${btnBase}`}
      >
        <Zap className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Rápidas</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div
          className={`absolute bottom-full mb-2 right-0 w-72 border rounded-xl shadow-xl z-50 overflow-hidden ${menuBg}`}
        >
          {/* Header */}
          <div className={`px-3 py-2 border-b text-xs font-semibold uppercase tracking-wide ${textSub} ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            {inputValue.startsWith('/') ? `Atalhos para "${inputValue}"` : 'Respostas rápidas'}
          </div>

          {filtradas.length > 0 ? (
            <ul className="max-h-56 overflow-y-auto">
              {filtradas.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(r)}
                    className={`w-full text-left px-3 py-2.5 transition-colors border-b last:border-b-0 ${itemHov} ${isDark ? 'border-slate-700/50' : 'border-gray-100'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium ${textPre}`}>{r.titulo}</span>
                      {r.atalho && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${isDark ? 'bg-slate-600 text-cyan-400' : 'bg-gray-100 text-cyan-700'}`}>
                          {r.atalho}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 line-clamp-2 ${textSub}`}>{r.conteudo}</p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`p-4 text-center text-sm ${textSub}`}>
              {inputValue.startsWith('/') ? `Nenhum atalho para "${inputValue}"` : 'Nenhuma resposta cadastrada'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
