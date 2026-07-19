import { ReactNode } from 'react';
import { MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface ClienteLayoutProps {
  children: ReactNode;
}

export function ClienteLayout({ children }: ClienteLayoutProps) {
  const { usuario, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505]">
      <header className="bg-slate-900 border-b border-slate-800 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 leading-none">WhatsApp SaaS</h1>
              <p className="text-xs text-slate-500 mt-0.5">Cliente · {usuario?.email}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={LogOut} onClick={logout}>
            Sair
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-5">{children}</main>
    </div>
  );
}
