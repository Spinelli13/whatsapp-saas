import { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Brain, MessageCircle, RefreshCw } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import MetricasChart from '../components/analytics/MetricasChart';
import RecomendacoesWidget from '../components/analytics/RecomendacoesWidget';

type Aba = 'visao-geral' | 'sentimento' | 'ia';

interface Tendencias {
  periodo: number;
  tendencia: 'crescente' | 'decrescente' | 'estavel';
  metricas: unknown[];
}

interface Metrica {
  id: string;
  data: string;
  total_oportunidades: number;
  oportunidades_ganhas: number;
  oportunidades_perdidas: number;
  valor_total: string;
  valor_ganho: string;
  taxa_conversao: string;
  ticket_medio: string;
}

interface Recomendacao {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'proximo_passo' | 'risco_perda' | 'melhor_momento' | 'personalizacao';
  prioridade: 'baixa' | 'media' | 'alta';
  acao_sugerida: string | null;
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

export default function AnalyticsPage() {
  const { theme } = useThemeStore();
  const { token } = useAuthStore();
  const isDark = theme === 'dark';

  const [aba, setAba] = useState<Aba>('visao-geral');
  const [metricas, setMetricas] = useState<Metrica[] | null>(null);
  const [tendencias, setTendencias] = useState<Tendencias | null>(null);
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState(false);

  // Sentimento form
  const [textoSentimento, setTextoSentimento] = useState('');
  const [resultadoSentimento, setResultadoSentimento] = useState<{ sentimento: string; confianca: number; palavras_chave: string[] } | null>(null);
  const [analisando, setAnalisando] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const hoje = new Date().toISOString().split('T')[0];
  const mes30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [mRes, tRes, rRes] = await Promise.all([
        fetch(`/api/analytics/metricas/diarias?dataInicio=${mes30}&dataFim=${hoje}`, { headers }),
        fetch('/api/analytics/tendencias?dias=30', { headers }),
        fetch('/api/analytics/ia/recomendacoes', { headers }),
      ]);
      const [mData, tData, rData] = await Promise.all([mRes.json(), tRes.json(), rRes.json()]);
      setMetricas(Array.isArray(mData) ? mData : []);
      setTendencias(tData);
      setRecomendacoes(Array.isArray(rData) ? rData : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const calcularHoje = async () => {
    setCalculando(true);
    try {
      await fetch('/api/analytics/metricas/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({}),
      });
      await carregarDados();
    } catch {
      // silent
    } finally {
      setCalculando(false);
    }
  };

  const analisarSentimento = async () => {
    if (!textoSentimento.trim()) return;
    setAnalisando(true);
    setResultadoSentimento(null);
    try {
      const res = await fetch('/api/analytics/sentimento/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ texto: textoSentimento }),
      });
      const data = await res.json();
      setResultadoSentimento(data);
    } catch {
      // silent
    } finally {
      setAnalisando(false);
    }
  };

  const tabClass = (tab: Aba) =>
    `flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
      aba === tab
        ? `border-cyan-500 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`
        : `border-transparent ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-900'}`
    }`;

  const sentimentoColor: Record<string, string> = {
    positivo: 'text-green-400',
    negativo: 'text-red-400',
    neutro: isDark ? 'text-slate-300' : 'text-gray-600',
  };

  return (
    <div className={`p-6 space-y-6 min-h-full ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Analytics + IA
        </h2>
        <button
          onClick={calcularHoje}
          disabled={calculando}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium disabled:opacity-60 hover:shadow-lg transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${calculando ? 'animate-spin' : ''}`} />
          Calcular Hoje
        </button>
      </div>

      {/* Stats */}
      {tendencias && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            label="Tendência 30d"
            value={tendencias.tendencia === 'crescente' ? '↑ Crescente' : tendencias.tendencia === 'decrescente' ? '↓ Decrescente' : '→ Estável'}
            icon={TrendingUp}
            isDark={isDark}
          />
          <StatCard
            label="Recomendações Ativas"
            value={recomendacoes.length}
            icon={Brain}
            isDark={isDark}
          />
          <StatCard
            label="Registros de Métricas"
            value={metricas?.length ?? 0}
            icon={BarChart3}
            isDark={isDark}
          />
        </div>
      )}

      {/* Tabs */}
      <div className={`flex gap-0 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <button className={tabClass('visao-geral')} onClick={() => setAba('visao-geral')}>
          <BarChart3 className="w-4 h-4" />
          Visão Geral
        </button>
        <button className={tabClass('sentimento')} onClick={() => setAba('sentimento')}>
          <MessageCircle className="w-4 h-4" />
          Sentimento
        </button>
        <button className={tabClass('ia')} onClick={() => setAba('ia')}>
          <Brain className="w-4 h-4" />
          IA &amp; Recomendações
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Carregando...</div>
      ) : (
        <>
          {aba === 'visao-geral' && <MetricasChart metricas={metricas} isDark={isDark} />}

          {aba === 'sentimento' && (
            <div className="space-y-4">
              <div className={`p-6 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Analisar texto
                </h3>
                <textarea
                  rows={4}
                  placeholder="Digite um texto para análise de sentimento..."
                  className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${isDark ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                  value={textoSentimento}
                  onChange={(e) => setTextoSentimento(e.target.value)}
                />
                <button
                  onClick={analisarSentimento}
                  disabled={analisando || !textoSentimento.trim()}
                  className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium disabled:opacity-60"
                >
                  {analisando ? 'Analisando...' : 'Analisar Sentimento'}
                </button>

                {resultadoSentimento && (
                  <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                    <p className={`font-bold text-lg capitalize ${sentimentoColor[resultadoSentimento.sentimento]}`}>
                      {resultadoSentimento.sentimento}
                    </p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      Confiança: {(parseFloat(String(resultadoSentimento.confianca)) * 100).toFixed(0)}%
                    </p>
                    {resultadoSentimento.palavras_chave?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {resultadoSentimento.palavras_chave.map((p) => (
                          <span key={p} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {aba === 'ia' && (
            <RecomendacoesWidget
              recomendacoes={recomendacoes}
              onRefresh={carregarDados}
              isDark={isDark}
            />
          )}
        </>
      )}
    </div>
  );
}
