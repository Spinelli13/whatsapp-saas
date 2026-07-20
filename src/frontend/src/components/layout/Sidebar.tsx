import { NavLink } from 'react-router-dom';
import {
  BarChart3, MessageCircle, Shield, Lock, CreditCard,
  Users, LogOut, FileText, TrendingUp,
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../../hooks/useAuth';

interface NavItemProps {
  label: string;
  to: string;
  Icon: React.ElementType;
  end?: boolean;
  isDark: boolean;
}

function NavItem({ label, to, Icon, end, isDark }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150 mx-2 rounded-lg ${
          isActive
            ? isDark
              ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/30'
              : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
            : isDark
              ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

function Divider({ isDark }: { isDark: boolean }) {
  return <div className={`h-px mx-4 my-1 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />;
}

export function Sidebar() {
  const { theme } = useThemeStore();
  const { usuario, logout } = useAuth();
  const isDark = theme === 'dark';
  const isAdmin = usuario?.role === 'admin';

  return (
    <aside className={`w-56 border-r flex flex-col flex-shrink-0 ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
    }`}>
      <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0" />
          <span className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            WSCRM
          </span>
          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
            isDark ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-500'
          }`}>
            {isAdmin ? 'Admin' : 'Cliente'}
          </span>
        </div>
      </div>

      <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto">
        <NavItem to="/dashboard" label="Dashboard" Icon={BarChart3} end isDark={isDark} />

        {isAdmin ? (
          <>
            <NavItem to="/admin/clientes" label="Clientes" Icon={Users} isDark={isDark} />
            <NavItem to="/admin/relatorios" label="Relatórios" Icon={FileText} isDark={isDark} />
            <Divider isDark={isDark} />
            <NavItem to="/configuracoes/usuarios" label="Permissões" Icon={Lock} isDark={isDark} />
            <NavItem to="/configuracoes/planos" label="Planos" Icon={CreditCard} isDark={isDark} />
          </>
        ) : (
          <>
            <NavItem to="/cliente" label="Fila" Icon={MessageCircle} isDark={isDark} />
            <NavItem to="/vendas" label="Vendas" Icon={TrendingUp} isDark={isDark} />
          </>
        )}

        <Divider isDark={isDark} />
        <NavItem to="/configuracoes/seguranca" label="Segurança" Icon={Shield} isDark={isDark} />
      </nav>

      <div className={`p-3 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
            isDark
              ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
