import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStatusAtendente, StatusAtendente } from '../../hooks/useStatusAtendente';

const STATUS_CONFIG: Record<StatusAtendente, { dot: string; label: string; ring: string }> = {
  online:  { dot: 'bg-green-500',  label: 'Online',  ring: 'ring-green-500/40' },
  ausente: { dot: 'bg-amber-400',  label: 'Ausente', ring: 'ring-amber-400/40' },
  offline: { dot: 'bg-red-500',    label: 'Offline', ring: 'ring-red-500/40' },
};

export default function StatusAtendenteToggle() {
  const { status, mudar, loading } = useStatusAtendente();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  const handleMudar = async (novoStatus: StatusAtendente) => {
    try {
      await mudar(novoStatus);
      setAberto(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const cfg = STATUS_CONFIG[status];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        disabled={loading}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ring-2 ${cfg.ring} ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
        } bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200`}
      >
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <span>{cfg.label}</span>
        <ChevronDown size={12} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="absolute top-full mt-1 right-0 w-36 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {(Object.entries(STATUS_CONFIG) as [StatusAtendente, typeof STATUS_CONFIG[StatusAtendente]][]).map(([s, c]) => (
            <button
              key={s}
              onClick={() => handleMudar(s)}
              disabled={loading || s === status}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40"
            >
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${c.dot}`} />
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
