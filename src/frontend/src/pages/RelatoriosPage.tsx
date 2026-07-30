import { BarChart3, Download, RefreshCw } from 'lucide-react';
import { useRelatorios } from '../hooks/useRelatorios';
import { useThemeStore } from '../store/themeStore';
import DashboardMetricas from '../components/ui/DashboardMetricas';

export default function RelatoriosPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { dashboard, loading, dataInicio, setDataInicio, dataFim, setDataFim, carregar, exportarCSV } = useRelatorios();

  const inputClass = `px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-1 focus:ring-cyan-500/30 ${
    isDark
      ? 'bg-slate-800 border-slate-700 text-slate-100'
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  const atalhos = [
    { label: 'Hoje',       dias: 0 },
    { label: '7 dias',     dias: 7 },
    { label: '30 dias',    dias: 30 },
    { label: 'Este mês',   dias: -1 },
  ];

  const aplicarAtalho = (dias: number) => {
    const fim = new Date();
    const ini = new Date();
    if (dias === -1) {
      ini.setDate(1);
    } else {
      ini.setDate(ini.getDate() - dias);
    }
    setDataInicio(ini.toISOString().split('T')[0]);
    setDataFim(fim.toISOString().split('T')[0]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Relatórios e Análises
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            TME, TMA, Volume, Performance de Atendentes e Satisfação
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Filtros */}
          <div className={`rounded-xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <p className={`text-xs font-medium mb-1.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>De</p>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <p className={`text-xs font-medium mb-1.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Até</p>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Atalhos */}
              <div className="flex gap-1.5">
                {atalhos.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => aplicarAtalho(a.dias)}
                    className={`px-2.5 py-2 text-xs rounded-lg border transition-colors ${
                      isDark
                        ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 ml-auto">
                <button
                  onClick={carregar}
                  disabled={loading || !dataInicio || !dataFim}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Gerando...' : 'Gerar Relatório'}
                </button>
                <button
                  onClick={exportarCSV}
                  disabled={!dashboard || !dataInicio || !dataFim}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  <Download size={14} />
                  Exportar CSV
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard */}
          {loading && (
            <div className={`flex items-center justify-center py-16 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              <RefreshCw size={24} className="animate-spin mr-3" />
              <span className="text-sm">Carregando dados...</span>
            </div>
          )}

          {!loading && !dashboard && (
            <div className={`flex flex-col items-center justify-center py-16 gap-3 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <BarChart3 className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-sm">Selecione um período e clique em <strong>Gerar Relatório</strong></p>
            </div>
          )}

          {!loading && dashboard && <DashboardMetricas data={dashboard} />}
        </div>
      </div>
    </div>
  );
}
