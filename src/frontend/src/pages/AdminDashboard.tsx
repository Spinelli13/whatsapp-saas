import { Link } from 'react-router-dom';
import { Users, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

const STATS = [
  { label: 'Total Clientes', value: '12', Icon: Users, trend: '+3 este mês', color: 'text-cyan-400' },
  { label: 'Mensagens/Mês', value: '45.2K', Icon: TrendingUp, trend: '+15% vs último mês', color: 'text-emerald-400' },
  { label: 'Alertas', value: '3', Icon: AlertCircle, trend: 'Ação necessária', color: 'text-amber-400' },
];

const CLIENTES = [
  { id: 1, nome: 'Empresa A', plano: 'Profissional', usuarios: 5 },
  { id: 2, nome: 'Empresa B', plano: 'Básico', usuarios: 2 },
  { id: 3, nome: 'Empresa C', plano: 'Enterprise', usuarios: 15 },
];

export default function AdminDashboard() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Dashboard Administrativo
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            Visão geral da plataforma
          </p>
        </div>
        <Link
          to="/admin/clientes/novo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-cyan-900/30 transition-all"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className={`p-5 rounded-xl border transition-all duration-300 hover:shadow-lg ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            <s.Icon className={`h-6 w-6 mb-3 ${s.color}`} />
            <p className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              {s.value}
            </p>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {s.label}
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
              {s.trend}
            </p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
          <h3 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Clientes Ativos
          </h3>
          <Link to="/admin/clientes" className="text-sm text-cyan-500 hover:text-cyan-400 transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
                {['Nome', 'Plano', 'Usuários', 'Status'].map((col) => (
                  <th key={col} className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLIENTES.map((c) => (
                <tr
                  key={c.id}
                  className={`border-b last:border-0 transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800/50' : 'border-gray-50 hover:bg-gray-50'}`}
                >
                  <td className={`px-6 py-3.5 font-medium text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>{c.nome}</td>
                  <td className={`px-6 py-3.5 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{c.plano}</td>
                  <td className={`px-6 py-3.5 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{c.usuarios}</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-1 rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-medium">
                      Ativo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
