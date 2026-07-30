import { useState } from 'react';
import { Plus, Trash2, GitBranch, Clock, Users, Zap } from 'lucide-react';
import { useRoteamento, ConfigRoteamento } from '../hooks/useRoteamento';
import { useThemeStore } from '../store/themeStore';

const TIPO_LABELS: Record<string, string> = {
  least_busy: 'Menos Ocupado',
  round_robin: 'Distribuição Igual',
  skill: 'Por Habilidade',
  manual: 'Manual',
};

const NIVEL_LABELS: Record<string, string> = {
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export default function RoteamentoPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { configs, skills, loading, criarConfig, atualizarConfig, adicionarSkill, deletarSkill } = useRoteamento();

  const [novoTipo, setNovoTipo] = useState<ConfigRoteamento['tipo_roteamento']>('least_busy');
  const [novoLimite, setNovoLimite] = useState(10);
  const [novoSLA, setNovoSLA] = useState(5);
  const [novoSkill, setNovoSkill] = useState('');
  const [novoNivel, setNovoNivel] = useState('basico');
  const [criando, setCriando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);

  const inputClass = `w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-1 focus:ring-cyan-500/30 ${
    isDark
      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-600'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  const labelClass = `block text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`;

  const cardClass = `rounded-xl border p-5 ${
    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'
  }`;

  const handleCriarConfig = async () => {
    try {
      setCriando(true);
      await criarConfig({ tipo_roteamento: novoTipo, limite_simultaneos: novoLimite, tempo_sla_minutos: novoSLA });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCriando(false);
    }
  };

  const handleToggleAtivo = async (config: ConfigRoteamento) => {
    try {
      await atualizarConfig(config.id, { ativo: !config.ativo });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAdicionarSkill = async () => {
    if (!novoSkill.trim()) return;
    try {
      setAdicionando(true);
      await adicionarSkill(novoSkill.trim(), novoNivel);
      setNovoSkill('');
      setNovoNivel('basico');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdicionando(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
          <GitBranch className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Roteamento Avançado
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            Regras de distribuição de atendimentos entre atendentes
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Criar nova configuração ── */}
          <div className={cardClass}>
            <h2 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
              <Zap size={14} />
              Nova Configuração
            </h2>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Tipo de Roteamento</label>
                <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as any)} className={inputClass}>
                  <option value="least_busy">Menos Ocupado (Recomendado)</option>
                  <option value="round_robin">Round Robin — Distribuição Igual</option>
                  <option value="skill">Por Habilidade (Skill)</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Limite Simultâneos</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={novoLimite}
                    onChange={(e) => setNovoLimite(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>SLA (minutos)</label>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={novoSLA}
                    onChange={(e) => setNovoSLA(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                onClick={handleCriarConfig}
                disabled={criando}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                <Plus size={14} />
                {criando ? 'Criando...' : 'Criar Configuração'}
              </button>
            </div>

            {/* Lista de configurações */}
            <div className={`mt-5 pt-4 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
              <p className={labelClass}>Configurações ativas</p>
              {loading ? (
                <p className={`text-xs text-center py-3 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>Carregando...</p>
              ) : configs.length === 0 ? (
                <p className={`text-xs text-center py-3 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>Nenhuma configuração</p>
              ) : (
                configs.map((config) => (
                  <div
                    key={config.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                        {TIPO_LABELS[config.tipo_roteamento] || config.tipo_roteamento}
                      </p>
                      <div className={`flex gap-3 mt-0.5 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        <span className="flex items-center gap-1"><Users size={10} /> {config.limite_simultaneos}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {config.tempo_sla_minutos}min</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleAtivo(config)}
                      className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                        config.ativo
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isDark ? 'bg-slate-700 text-slate-500' : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {config.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Skills do atendente ── */}
          <div className={cardClass}>
            <h2 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
              <Users size={14} />
              Minhas Habilidades (Skills)
            </h2>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Nome da Skill</label>
                <input
                  type="text"
                  value={novoSkill}
                  onChange={(e) => setNovoSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdicionarSkill()}
                  placeholder="Ex: Vendas, Suporte, Financeiro..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Nível</label>
                <select value={novoNivel} onChange={(e) => setNovoNivel(e.target.value)} className={inputClass}>
                  <option value="basico">Básico</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>

              <button
                onClick={handleAdicionarSkill}
                disabled={adicionando || !novoSkill.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                <Plus size={14} />
                {adicionando ? 'Adicionando...' : 'Adicionar Skill'}
              </button>
            </div>

            <div className={`mt-5 pt-4 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
              <p className={labelClass}>Suas skills cadastradas</p>
              {skills.length === 0 ? (
                <p className={`text-xs text-center py-3 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>Nenhuma skill cadastrada</p>
              ) : (
                skills.map((skill) => (
                  <div
                    key={skill.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                        {skill.nome_skill}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        {NIVEL_LABELS[skill.nivel] || skill.nivel}
                      </p>
                    </div>
                    <button
                      onClick={() => deletarSkill(skill.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
