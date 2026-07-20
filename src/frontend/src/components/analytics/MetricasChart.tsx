import { BarChart3 } from 'lucide-react';

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

interface MetricasChartProps {
  metricas: Metrica[] | null;
  isDark: boolean;
}

export default function MetricasChart({ metricas, isDark }: MetricasChartProps) {
  if (!metricas || metricas.length === 0) {
    return (
      <div className={`p-12 rounded-lg border text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <BarChart3 className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Sem dados de métricas</p>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
          Gere métricas clicando em "Calcular Hoje"
        </p>
      </div>
    );
  }

  const maxOpor = Math.max(...metricas.map((m) => m.total_oportunidades), 1);

  return (
    <div className={`p-6 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
      <h3 className={`font-semibold mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Métricas de Vendas — últimos {metricas.length} registros
      </h3>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Oportunidades', value: metricas[metricas.length - 1].total_oportunidades },
          { label: 'Ganhas', value: metricas[metricas.length - 1].oportunidades_ganhas, color: 'text-green-400' },
          { label: 'Taxa Conversão', value: `${parseFloat(metricas[metricas.length - 1].taxa_conversao).toFixed(1)}%` },
          { label: 'Ticket Médio', value: `R$ ${parseFloat(metricas[metricas.length - 1].ticket_medio).toLocaleString('pt-BR')}` },
        ].map(({ label, value, color }) => (
          <div key={label} className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{label}</p>
            <p className={`font-bold text-lg mt-0.5 ${color ?? (isDark ? 'text-white' : 'text-gray-900')}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="space-y-2">
        {metricas.slice(-7).map((m) => (
          <div key={m.id} className="flex items-center gap-3">
            <span className={`text-xs w-20 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
            <div className="flex-1 flex items-center gap-2">
              <div
                className="h-5 rounded bg-gradient-to-r from-cyan-600 to-blue-600 min-w-[4px] transition-all"
                style={{ width: `${(m.total_oportunidades / maxOpor) * 100}%` }}
              />
              <div
                className="h-5 rounded bg-green-500/60 min-w-0 transition-all"
                style={{ width: `${(m.oportunidades_ganhas / maxOpor) * 100}%` }}
              />
            </div>
            <span className={`text-xs w-6 text-right ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {m.total_oportunidades}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-4">
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded bg-gradient-to-r from-cyan-600 to-blue-600" />
          <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Total</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded bg-green-500/60" />
          <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Ganhas</span>
        </span>
      </div>
    </div>
  );
}
