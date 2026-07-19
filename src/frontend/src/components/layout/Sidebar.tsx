import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  MessageCircle,
  Shield,
  Lock,
  CreditCard,
  Users,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  Icon: React.ElementType;
  end?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', Icon: BarChart3, end: true },
  { label: 'Cliente', href: '/cliente', Icon: MessageCircle },
  { label: 'Permissões', href: '/admin/permissoes', Icon: Lock },
  { label: 'Planos', href: '/planos', Icon: CreditCard },
  { label: 'Segurança', href: '/security', Icon: Shield },
  { label: 'Clientes', href: '/admin/clientes', Icon: Users },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Menu</p>
      </div>
      <nav className="flex-1 py-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150 mx-2 rounded-lg ${
                isActive
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            <item.Icon className="h-4 w-4 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
