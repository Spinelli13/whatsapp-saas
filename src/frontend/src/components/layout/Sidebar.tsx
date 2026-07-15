import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Fila', href: '/dashboard/fila', icon: '📋' },
  { label: 'Histórico', href: '/dashboard/historico', icon: '📜' },
  { label: 'Relatórios', href: '/dashboard/relatorios', icon: '📈' },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-700">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Menu</p>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
