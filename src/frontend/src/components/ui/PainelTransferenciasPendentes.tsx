import { useState } from 'react';
import { ArrowRightLeft, Check, X } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { Transferencia } from '../../hooks/useTransferencias';

interface PainelTransferenciasPendentesProps {
  pendentes: Transferencia[];
  onAceitar: (id: string) => Promise<unknown>;
  onRejeitar: (id: string, motivo?: string) => Promise<unknown>;
}

export function PainelTransferenciasPendentes({
  pendentes,
  onAceitar,
  onRejeitar,
}: PainelTransferenciasPendentesProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [processando, setProcessando] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [rejeitando, setRejeitando] = useState<string | null>(null);

  if (pendentes.length === 0) return null;

  const handleAceitar = async (id: string) => {
    setProcessando(id);
    try { await onAceitar(id); } finally { setProcessando(null); }
  };

  const handleRejeitar = async (id: string) => {
    setProcessando(id);
    try {
      await onRejeitar(id, motivoRejeicao || undefined);
      setRejeitando(null);
      setMotivoRejeicao('');
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${
      isDark ? 'bg-amber-900/20 border-amber-700/40' : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-center gap-2">
        <ArrowRightLeft size={14} className="text-amber-500" />
        <span className={`text-xs font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
          Transferências Pendentes ({pendentes.length})
        </span>
      </div>

      {pendentes.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg p-3 border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`text-xs font-medium truncate ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                {t.atendimento?.nome_cliente || t.atendimento?.numero_whatsapp || t.atendimento_id}
              </p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                De: {t.origem?.nome || `#${t.atendente_origem_id}`}
              </p>
              {t.motivo && (
                <p className={`text-xs mt-1 italic ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  "{t.motivo}"
                </p>
              )}
            </div>

            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={() => handleAceitar(t.id)}
                disabled={processando === t.id}
                title="Aceitar transferência"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
              >
                <Check size={11} />
                Aceitar
              </button>
              <button
                onClick={() => setRejeitando(t.id)}
                disabled={processando === t.id}
                title="Rejeitar transferência"
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs border disabled:opacity-50 transition-colors ${
                  isDark
                    ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <X size={11} />
                Rejeitar
              </button>
            </div>
          </div>

          {rejeitando === t.id && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Motivo da rejeição (opcional)"
                className={`w-full px-2 py-1.5 rounded-md text-xs border focus:outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300'
                }`}
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setRejeitando(null); setMotivoRejeicao(''); }}
                  className={`text-xs px-2 py-1 rounded ${isDark ? 'text-slate-500' : 'text-gray-400'}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRejeitar(t.id)}
                  disabled={processando === t.id}
                  className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                >
                  Confirmar Rejeição
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
