import { useState, useEffect, useCallback } from 'react';
import { Plus, Zap, GitBranch, TrendingUp, CheckCircle } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import WorkflowList from '../components/automacoes/WorkflowList';

interface Workflow {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: 'trigger_manual' | 'trigger_evento' | 'agendado';
  status: 'ativo' | 'inativo' | 'pausado';
  execucoes_count: number;
  triggers: unknown[];
  acoes: unknown[];
}

interface Stats {
  total: number;
  ativos: number;
  execucoes: number;
  sucessos: number;
  taxaSucesso: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  isDark: boolean;
}

function StatCard({ label, value, icon: Icon, isDark }: StatCardProps) {
  return (
    <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{label}</p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        </div>
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
    </div>
  );
}

export default function AutomacoesPage() {
  const { theme } = useThemeStore();
  const { token } = useAuthStore();
  const isDark = theme === 'dark';

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<'workflows' | 'builder'>('workflows');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '', tipo: 'trigger_evento' as Workflow['tipo'] });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [wRes, sRes] = await Promise.all([
        fetch('/api/automacoes/workflows', { headers }),
        fetch('/api/automacoes/workflows/stats/dashboard', { headers }),
      ]);
      const [wData, sData] = await Promise.all([wRes.json(), sRes.json()]);
      setWorkflows(wData);
      setStats(sData);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const criarWorkflow = async () => {
    if (!form.nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/automacoes/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro ao criar'); return; }
      setShowModal(false);
      setForm({ nome: '', descricao: '', tipo: 'trigger_evento' });
      await carregarDados();
    } catch {
      setErro('Erro de conexão');
    } finally {
      setSalvando(false);
    }
  };

  const tabClass = (tab: typeof aba) =>
    `px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
      aba === tab
        ? `border-cyan-500 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`
        : `border-transparent ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`
    }`;

  return (
    <div className={`p-6 space-y-6 min-h-full ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Automações
        </h2>
        <button
          onClick={() => { setShowModal(true); setErro(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo Workflow
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} icon={Zap} isDark={isDark} />
          <StatCard label="Ativos" value={stats.ativos} icon={GitBranch} isDark={isDark} />
          <StatCard label="Execuções" value={stats.execucoes} icon={TrendingUp} isDark={isDark} />
          <StatCard label="Taxa Sucesso" value={`${stats.taxaSucesso}%`} icon={CheckCircle} isDark={isDark} />
        </div>
      )}

      {/* Tabs */}
      <div className={`flex gap-0 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <button className={tabClass('workflows')} onClick={() => setAba('workflows')}>
          Meus Workflows
        </button>
        <button className={tabClass('builder')} onClick={() => setAba('builder')}>
          Builder Visual
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Carregando...</div>
      ) : aba === 'workflows' ? (
        <WorkflowList workflows={workflows} onRefresh={carregarDados} />
      ) : (
        <div className={`p-8 rounded-lg border text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <Zap className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
          <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Builder Visual — Em breve</p>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            Drag &amp; drop com triggers, condições e ações
          </p>
        </div>
      )}

      {/* Modal criar workflow */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-xl border p-6 shadow-2xl ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Novo Workflow
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Nome *
                </label>
                <input
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Notificar ao ganhar oportunidade"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Tipo
                </label>
                <select
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as Workflow['tipo'] }))}
                >
                  <option value="trigger_evento">Trigger por Evento</option>
                  <option value="trigger_manual">Trigger Manual</option>
                  <option value="agendado">Agendado</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  Descrição
                </label>
                <textarea
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descreva o objetivo deste workflow"
                />
              </div>
              {erro && <p className="text-red-400 text-sm">{erro}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setErro(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Cancelar
              </button>
              <button
                onClick={criarWorkflow}
                disabled={salvando}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-600 to-blue-600 text-white disabled:opacity-60"
              >
                {salvando ? 'Criando...' : 'Criar Workflow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
