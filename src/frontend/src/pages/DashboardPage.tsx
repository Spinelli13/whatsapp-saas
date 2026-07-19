import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/ui/Loading';
import { Layout } from '../components/layout/Layout';
import { MetricasCards } from '../components/dashboard/MetricasCards';
import { FilaList } from '../components/dashboard/FilaList';
import { NotasPanel } from '../components/dashboard/NotasPanel';
import { HistoricoTimeline } from '../components/dashboard/HistoricoTimeline';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [ticketSelecionado, setTicketSelecionado] = useState<string | null>(null);

  if (!usuario) return <Loading message="Carregando..." />;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Bem-vindo, <span className="text-slate-300 font-medium">{usuario.nome || usuario.email}</span>
          </p>
        </div>

        <MetricasCards />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FilaList
              clienteId={usuario.cliente_id}
              departamentoId={undefined}
            />
          </div>
          <div className="space-y-4">
            <NotasPanel ticketId={ticketSelecionado} />
            <HistoricoTimeline ticketId={ticketSelecionado} />
          </div>
        </div>

        {ticketSelecionado === null && (
          <p className="text-xs text-slate-600 text-center">
            Clique em um ticket na fila para ver notas e histórico
          </p>
        )}
      </div>
    </Layout>
  );
}
