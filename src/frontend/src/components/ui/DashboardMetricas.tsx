import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useThemeStore } from '../../store/themeStore';
import { DashboardData } from '../../hooks/useRelatorios';

interface Props {
  data: DashboardData;
}

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  return (
    <div className={`rounded-xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
      <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      <p className={`text-xs mt-1 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>{sub}</p>
    </div>
  );
}

export default function DashboardMetricas({ data }: Props) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const cardClass = `rounded-xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`;
  const textMuted = isDark ? 'text-slate-500' : 'text-gray-400';
  const textMain  = isDark ? 'text-slate-200' : 'text-gray-800';
  const strokeColor = isDark ? '#94a3b8' : '#6b7280';

  const volumeData = data.volume_por_periodo.map((v) => ({
    ...v,
    periodo: v.periodo ? new Date(v.periodo).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '',
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="TME" value={`${data.metricas_gerais.tme_segundos}s`}  sub="Tempo Médio Espera"       color="text-cyan-500" />
        <KpiCard label="TMA" value={`${data.metricas_gerais.tma_segundos}s`}  sub="Tempo Médio Atendimento"  color="text-emerald-500" />
        <KpiCard label="CSAT" value={data.satisfacao.csat_media}              sub={`${data.satisfacao.total_avaliacoes} avaliações`} color="text-violet-500" />
        <KpiCard label="NPS"  value={data.satisfacao.nps_media}               sub="Net Promoter Score"       color="text-amber-500" />
      </div>

      {/* Volume por período */}
      <div className={cardClass}>
        <h3 className={`text-sm font-semibold mb-4 ${textMain}`}>Volume de Tickets por Dia</h3>
        {volumeData.length === 0 ? (
          <p className={`text-xs text-center py-8 ${textMuted}`}>Nenhum dado no período selecionado</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f0f0f0'} />
              <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: strokeColor }} />
              <YAxis tick={{ fontSize: 11, fill: strokeColor }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', borderColor: isDark ? '#1e293b' : '#e5e7eb' }} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#06b6d4" name="Tickets" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Atendentes */}
      <div className={cardClass}>
        <h3 className={`text-sm font-semibold mb-4 ${textMain}`}>Top 5 Atendentes</h3>
        {data.top_atendentes.length === 0 ? (
          <p className={`text-xs text-center py-8 ${textMuted}`}>Nenhum dado no período</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.top_atendentes.map((a) => ({ ...a, nome: a.usuario?.nome || 'N/A' }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f0f0f0'} />
              <XAxis dataKey="nome" tick={{ fontSize: 11, fill: strokeColor }} />
              <YAxis tick={{ fontSize: 11, fill: strokeColor }} />
              <Tooltip contentStyle={{ background: isDark ? '#0f172a' : '#fff', borderColor: isDark ? '#1e293b' : '#e5e7eb' }} />
              <Legend />
              <Bar dataKey="tma_segundos"      fill="#06b6d4" name="TMA (s)"  radius={[3,3,0,0]} />
              <Bar dataKey="total_atendimentos" fill="#10b981" name="Total"   radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Performance por Departamento */}
      <div className={cardClass}>
        <h3 className={`text-sm font-semibold mb-4 ${textMain}`}>Performance por Departamento</h3>
        {data.performance_departamentos.length === 0 ? (
          <p className={`text-xs text-center py-4 ${textMuted}`}>Nenhum dado no período</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
                  <th className={`text-left py-2 text-xs font-medium ${textMuted}`}>Departamento</th>
                  <th className={`text-right py-2 text-xs font-medium ${textMuted}`}>Atendimentos</th>
                  <th className={`text-right py-2 text-xs font-medium ${textMuted}`}>TMA</th>
                </tr>
              </thead>
              <tbody>
                {data.performance_departamentos.map((d, i) => (
                  <tr key={i} className={`border-b ${isDark ? 'border-slate-800' : 'border-gray-50'}`}>
                    <td className={`py-2 text-xs ${textMain}`}>{d.departamento?.nome || '—'}</td>
                    <td className={`text-right text-xs ${textMuted}`}>{d.total}</td>
                    <td className={`text-right text-xs ${textMuted}`}>{d.tma_segundos}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
