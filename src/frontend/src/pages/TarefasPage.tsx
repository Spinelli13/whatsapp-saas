import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle2, Clock, AlertCircle, Zap, X } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import TarefasBoard from '../components/tarefas/TarefasBoard';

interface Metricas {
  total: number;
  concluidas: number;
  emProgresso: number;
  vencidas: number;
  taxaConclusao: number;
}

interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  status: 'todo' | 'em_progresso' | 'concluida';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  data_vencimento?: string;
  usuarioAtribuido?: { nome: string };
}

interface NovaForm { titulo: string; prioridade: string; data_vencimento: string }

function MetricCard({ label, value, Icon, isDark, colorClass }: {
  label: string; value: string | number; Icon: React.ElementType; isDark: boolean; colorClass: string;
}) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
    }`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{label}</p>
        <p className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );
}

export default function TarefasPage() {
  const { theme } = useThemeStore();
  const token = useAuthStore((s) => s.token);
  const isDark = theme === 'dark';

  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'minhas'>('todas');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<NovaForm>({ titulo: '', prioridade: 'media', data_vencimento: '' });
  const [salvando, setSalvando] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const carregar = useCallback(async () => {
    setLoading(true);
    const params = filtro === 'minhas' ? '?apenas_minhas=true' : '';
    const [tRes, mRes] = await Promise.all([
      fetch(`/api/tarefas${params}`, { headers }),
      fetch('/api/tarefas/metricas', { headers }),
    ]);
    if (tRes.ok) setTarefas(await tRes.json());
    if (mRes.ok) setMetricas(await mRes.json());
    setLoading(false);
  }, [token, filtro]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar() {
    if (!form.titulo.trim()) return;
    setSalvando(true);
    const res = await fetch('/api/tarefas', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        titulo: form.titulo,
        prioridade: form.prioridade,
        data_vencimento: form.data_vencimento || undefined,
      }),
    });
    setSalvando(false);
    if (res.ok) { setModal(false); carregar(); }
  }

  const filtroClass = (f: typeof filtro) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      filtro === f
        ? 'bg-cyan-600 text-white'
        : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`;

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
      }`}>
        <h1 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Tarefas</h1>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
        >
          <Plus className="h-4 w-4" /> Nova tarefa
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        {/* Métricas */}
        {metricas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Total" value={metricas.total} Icon={Zap} isDark={isDark} colorClass="bg-blue-500" />
            <MetricCard label="Em Progresso" value={metricas.emProgresso} Icon={Clock} isDark={isDark} colorClass="bg-yellow-500" />
            <MetricCard label="Concluídas" value={metricas.concluidas} Icon={CheckCircle2} isDark={isDark} colorClass="bg-green-500" />
            <MetricCard label="Vencidas" value={metricas.vencidas} Icon={AlertCircle} isDark={isDark} colorClass="bg-red-500" />
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2">
          <button className={filtroClass('todas')} onClick={() => setFiltro('todas')}>Todas</button>
          <button className={filtroClass('minhas')} onClick={() => setFiltro('minhas')}>Minhas</button>
        </div>

        {/* Board */}
        {loading ? (
          <div className={`text-center py-12 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Carregando...
          </div>
        ) : (
          <TarefasBoard tarefas={tarefas} onRefresh={carregar} />
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`w-full max-w-md rounded-xl border shadow-xl ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <h2 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Nova Tarefa</h2>
              <button onClick={() => setModal(false)} className={`p-1 rounded ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Título *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  placeholder="Descrição da tarefa"
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Prioridade</label>
                  <select
                    value={form.prioridade}
                    onChange={(e) => setForm((f) => ({ ...f, prioridade: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                    }`}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Vencimento</label>
                  <input
                    type="date"
                    value={form.data_vencimento}
                    onChange={(e) => setForm((f) => ({ ...f, data_vencimento: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>
            </div>
            <div className={`px-5 py-4 border-t flex justify-end gap-2 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <button onClick={() => setModal(false)} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'}`}>
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={!form.titulo.trim() || salvando}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white"
              >
                {salvando ? 'Salvando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
