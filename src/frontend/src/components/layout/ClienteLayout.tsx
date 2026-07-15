import { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface ClienteLayoutProps {
  children: ReactNode;
}

export function ClienteLayout({ children }: ClienteLayoutProps) {
  const { usuario, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp SaaS</h1>
            <p className="text-sm text-gray-600">Cliente · {usuario?.email}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">{children}</main>
    </div>
  );
}
