import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/ui/Loading';
import { ClienteLayout } from '../components/layout/ClienteLayout';
import { ConexaoWhatsApp } from '../components/cliente/ConexaoWhatsApp';
import { FilaClienteView } from '../components/cliente/FilaClienteView';
import { MinhasNotas } from '../components/cliente/MinhasNotas';
import { MeuHistorico } from '../components/cliente/MeuHistorico';

export default function ClientePage() {
  const { usuario } = useAuth();

  if (!usuario) return <Loading message="Carregando..." />;

  return (
    <ClienteLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Olá, Cliente!</h1>
          <p className="text-gray-600">Gerencie suas conversas pelo WhatsApp</p>
        </div>

        <ConexaoWhatsApp />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FilaClienteView clienteId={usuario.cliente_id} />
          <div className="space-y-6">
            <MinhasNotas clienteId={usuario.cliente_id} />
            <MeuHistorico clienteId={usuario.cliente_id} />
          </div>
        </div>
      </div>
    </ClienteLayout>
  );
}
