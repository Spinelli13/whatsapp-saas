import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';

export default function DashboardPage() {
  const { usuario, logout } = useAuth();

  if (!usuario) return <Loading message="Carregando..." />;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <h1 className="text-xl font-bold text-gray-900">WhatsApp SaaS</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{usuario.email}</span>
            <Button variant="secondary" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">🚧</div>
          <h2 className="text-xl font-semibold text-gray-700">Dashboard em construção</h2>
          <p className="text-gray-500 mt-2">
            Olá, <strong>{usuario.nome || usuario.email}</strong>! O painel de atendimento
            será implementado na Fase 3.3.
          </p>
        </div>
      </main>
    </div>
  );
}
