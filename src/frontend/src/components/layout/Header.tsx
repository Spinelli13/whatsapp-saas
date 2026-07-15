import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export function Header() {
  const { usuario, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 flex-shrink-0">
      <div className="flex items-center gap-2 flex-1">
        <span className="text-xl">💬</span>
        <span className="font-bold text-gray-900 text-sm">WhatsApp SaaS</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{usuario?.email}</span>
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
          {usuario?.role}
        </span>
        <Button variant="secondary" size="sm" onClick={logout}>
          Sair
        </Button>
      </div>
    </header>
  );
}
