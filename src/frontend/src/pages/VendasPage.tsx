import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Target, CheckCircle, XCircle, DollarSign, RefreshCw, Plus, X } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import PipelineBoard from '../components/vendas/PipelineBoard';

interface Metricas {
  total: number;
  ganhas: number;
  perdidas: number;
  taxaGanho: number;
  valorEsperado: number;
}

interface Estagio {
  id: string;
  nome: string;
  cor: string;
  oportunidades: Oportunidade[];
  total: number;
  valor_total: number;
}

interface Oportunidade {
  id: string;
  titulo: string;
  valor: number;
  probabilidade: number;
  data_fechamento_esperada?: string;
  status: string;
  responsavel?: { nome: string };
}

interface NovaOportunidadeForm {
  titulo: string;
  valor: string;
  probabilidade: string;
  estagio_id: string;
}

function formatValor(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

function MetricCard({
  label, value, icon: Icon, isDark, color,
}: { label: string; value: string | number; icon: React.ElementType; isDark: boolean; color: string }) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
    }`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{label}</p>
        <p className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );
}

export default function VendasPage() {
  const { theme } = useThemeStore();
  const token = useAuthStore((s) => s.token);
  const isDark = theme === 'dark';

  const [tab, setTab] = useState<'kanban' | 'metricas'>('kanban');
  const [estagios, setEstagios] = useState<Estagio[]>([]);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState<NovaOportunidadeForm>({ titulo: '', valor: '', probabilidade: '50', estagio_id: '' });
  const [salvando, setSalvando] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const carregarPipeline = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [pipelineRes, metricasRes] = await Promise.all([
        fetch('/api/vendas/pipeline', { headers }),
        fetch('/api/vendas/metricas', { headers }),
      ]);
      if (!pipelineRes.ok || !metricasRes.ok) throw new Error('Erro ao carregar dados');
      const [pipelineData, metricasData] = await Promise.all([pipelineRes.json(), metricasRes.json()]);
      setEstagios(pipelineData);
      setMetricas(metricasData);
    } catch {
      setErro('Não foi possível carregar o pipeline.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { carregarPipeline(); }, [carregarPipeline]);

  async function handleMover(oportunidadeId: string, estagioId: string) {
    await fetch(`/api/vendas/oportunidades/${oportunidadeId}/mover`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ estagio_id: estagioId }),
    });
    carregarPipeline();
  }

  function abrirModal(estagioId?: string) {
    setForm({ titulo: '', valor: '', probabilidade: '50', estagio_id: estagioId || estagios[0]?.id || '' });
    setModalAberto(true);
  }

  async function salvarOportunidade() {
    if (!form.titulo.trim()) return;
    setSalvando(true);
    try {
      const res = await fetch('/api/vendas/oportunidades', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          titulo: form.titulo,
          valor: parseFloat(form.valor) || 0,
          probabilidade: parseInt(form.probabilidade) || 50,
          estagio_id: form.estagio_id || undefined,
        }),
      });
      if (res.ok) {
        setModalAberto(false);
        carregarPipeline();
      }
    } finally {
      setSalvando(false);
    }
  }

  const tabClass = (t: typeof tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-all ${
      tab === t
        ? isDark ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/30' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
        : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-800'
    }`;

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <TrendingUp className={`h-5 w-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          <h1 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Vendas</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={carregarPipeline} className={`p-2 rounded-lg transition-all ${
            isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'
          }`}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
          >
            <Plus className="h-4 w-4" />
            Nova oportunidade
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`px-6 py-2 border-b flex gap-1 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <button className={tabClass('kanban')} onClick={() => setTab('kanban')}>Pipeline</button>
        <button className={tabClass('metricas')} onClick={() => setTab('metricas')}>Métricas</button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-hidden p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Carregando...</div>
          </div>
        ) : erro ? (
          <div className={`rounded-xl border p-6 text-center ${isDark ? 'border-slate-800 text-red-400' : 'border-gray-200 text-red-600'}`}>
            {erro}
          </div>
        ) : tab === 'kanban' ? (
          <PipelineBoard
            estagios={estagios}
            onMover={handleMover}
            onCardClick={() => {}}
            onNovaOportunidade={abrirModal}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Total" value={metricas?.total ?? 0} icon={Target} isDark={isDark} color="bg-blue-500" />
              <MetricCard label="Ganhas" value={metricas?.ganhas ?? 0} icon={CheckCircle} isDark={isDark} color="bg-green-500" />
              <MetricCard label="Perdidas" value={metricas?.perdidas ?? 0} icon={XCircle} isDark={isDark} color="bg-red-500" />
              <MetricCard label="Taxa de Ganho" value={`${metricas?.taxaGanho ?? 0}%`} icon={TrendingUp} isDark={isDark} color="bg-cyan-500" />
            </div>
            <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Valor Esperado (pipeline ativo)</p>
                  <p className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                    {formatValor(metricas?.valorEsperado ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Pipeline por estágio */}
            <div className={`rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>Por estágio</p>
              </div>
              <div className="divide-y divide-slate-800/50">
                {estagios.map((e) => (
                  <div key={e.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.cor }} />
                    <span className={`text-sm flex-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{e.nome}</span>
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{e.total} ops</span>
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                      {formatValor(e.valor_total)}
                    </span>
                  </div>
                ))}
                {estagios.length === 0 && (
                  <p className={`px-4 py-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    Nenhum estágio configurado
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal nova oportunidade */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`w-full max-w-md rounded-xl border shadow-xl ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <h2 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Nova Oportunidade</h2>
              <button onClick={() => setModalAberto(false)} className={`p-1 rounded ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
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
                  placeholder="Nome da oportunidade"
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Valor (R$)</label>
                  <input
                    type="number"
                    value={form.valor}
                    onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Probabilidade %</label>
                  <input
                    type="number"
                    value={form.probabilidade}
                    onChange={(e) => setForm((f) => ({ ...f, probabilidade: e.target.value }))}
                    min="0"
                    max="100"
                    className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-cyan-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Estágio</label>
                <select
                  value={form.estagio_id}
                  onChange={(e) => setForm((f) => ({ ...f, estagio_id: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-cyan-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                  }`}
                >
                  <option value="">Sem estágio</option>
                  {estagios.map((e) => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={`px-5 py-4 border-t flex justify-end gap-2 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <button
                onClick={() => setModalAberto(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={salvarOportunidade}
                disabled={!form.titulo.trim() || salvando}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-all"
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
