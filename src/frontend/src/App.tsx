import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';

// Lazy-loaded pages — split into per-route chunks
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const ClientePage = lazy(() => import('./pages/ClientePage'));
const PermissoesPage = lazy(() => import('./pages/PermissoesPage'));
const PlanosPage = lazy(() => import('./pages/PlanosPage'));
const AdminClientesPage = lazy(() => import('./pages/AdminClientesPage'));
const NovoClientePage = lazy(() => import('./pages/NovoClientePage'));
const AdminRelatoriosPage = lazy(() => import('./pages/AdminRelatoriosPage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));
const AtendimentoPage = lazy(() => import('./pages/AtendimentoPage'));
const VendasPage = lazy(() => import('./pages/VendasPage'));
const TarefasPage = lazy(() => import('./pages/TarefasPage'));
const CalendarioPage = lazy(() => import('./pages/CalendarioPage'));
const ComunicacaoPage = lazy(() => import('./pages/ComunicacaoPage'));
const AutomacoesPage = lazy(() => import('./pages/AutomacoesPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const WhatsappConfigPage = lazy(() => import('./pages/WhatsappConfigPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-full p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
    </div>
  );
}

function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </MainLayout>
  );
}

export default function App() {
  const usuario = useAuthStore((s) => s.usuario);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthLayout />}>
          <Route
            path="/dashboard"
            element={
              usuario?.role === 'admin' && !usuario?.cliente_id
                ? <AdminDashboard />   // super-admin da plataforma (sem cliente_id)
                : <ClientDashboard />  // admin/atendente de cliente
            }
          />
          <Route path="/admin/clientes" element={<AdminClientesPage />} />
          <Route path="/admin/clientes/novo" element={<NovoClientePage />} />
          <Route path="/admin/relatorios" element={<AdminRelatoriosPage />} />
          <Route path="/configuracoes/seguranca" element={<SecurityPage />} />
          <Route path="/configuracoes/usuarios" element={<PermissoesPage />} />
          <Route path="/configuracoes/planos" element={<PlanosPage />} />
          <Route path="/configuracoes/whatsapp" element={<WhatsappConfigPage />} />
          <Route path="/atendimento" element={<AtendimentoPage />} />
          <Route path="/cliente" element={<ClientePage />} />
          <Route path="/vendas" element={<VendasPage />} />
          <Route path="/tarefas" element={<TarefasPage />} />
          <Route path="/calendario" element={<CalendarioPage />} />
          <Route path="/comunicacao" element={<ComunicacaoPage />} />
          <Route path="/automacoes" element={<AutomacoesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
