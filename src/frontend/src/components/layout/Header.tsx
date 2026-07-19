import { MessageSquare, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export function Header() {
  const { usuario, logout } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 h-14 flex items-center px-5 flex-shrink-0">
      <div className="flex items-center gap-2.5 flex-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
          <MessageSquare className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-slate-100 text-sm tracking-tight">WhatsApp SaaS</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 hidden sm:inline">{usuario?.email}</span>
          <span className="text-xs bg-slate-800 text-cyan-400 border border-slate-700 px-2 py-0.5 rounded-full font-medium">
            {usuario?.role}
          </span>
        </div>
        <Button variant="secondary" size="sm" icon={LogOut} onClick={logout}>
          Sair
        </Button>
      </div>
    </header>
  );
}
