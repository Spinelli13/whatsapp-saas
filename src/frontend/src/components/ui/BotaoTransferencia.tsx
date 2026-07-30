import { useState } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useTransferencias } from '../../hooks/useTransferencias';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  status_atendente?: string;
}

interface BotaoTransferenciaProps {
  atendimentoId: string;
  atendentes: Usuario[];
  onSucesso?: () => void;
}

export function BotaoTransferencia({ atendimentoId, atendentes, onSucesso }: BotaoTransferenciaProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { solicitar } = useTransferencias();

  const [aberto, setAberto] = useState(false);
  const [atendenteId, setAtendenteId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSolicitar = async () => {
    if (!atendenteId) { setErro('Selecione um atendente'); return; }
    setEnviando(true);
    setErro(null);
    try {
      await solicitar({
        atendimento_id: atendimentoId,
        atendente_destino_id: Number(atendenteId),
        motivo: motivo || undefined,
      });
      setAberto(false);
      setAtendenteId('');
      setMotivo('');
      onSucesso?.();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao transferir');
    } finally {
      setEnviando(false);
    }
  };

  const disponiveis = atendentes.filter((a) => a.status_atendente !== 'offline');

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title="Transferir atendimento"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isDark
            ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        <ArrowRightLeft size={13} />
        Transferir
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-sm rounded-xl shadow-xl p-5 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                Transferir Atendimento
              </h3>
              <button onClick={() => setAberto(false)} className="text-slate-400 hover:text-slate-200">
                <X size={16} />
              </button>
            </div>

            {disponiveis.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Nenhum atendente disponível no momento.
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      Atendente destino *
                    </label>
                    <select
                      value={atendenteId}
                      onChange={(e) => setAtendenteId(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Selecione...</option>
                      {disponiveis.map((a) => (
                        <option key={a.id} value={a.id}>{a.nome} ({a.email})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      Motivo (opcional)
                    </label>
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      rows={2}
                      placeholder="Motivo da transferência..."
                      className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none resize-none ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  {erro && <p className="text-red-400 text-xs">{erro}</p>}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setAberto(false)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSolicitar}
                    disabled={enviando}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition-colors"
                  >
                    {enviando ? 'Solicitando...' : 'Solicitar Transferência'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
