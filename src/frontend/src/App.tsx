import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import ClientePage from './pages/ClientePage';
import PermissoesPage from './pages/PermissoesPage';
import PlanosPage from './pages/PlanosPage';
import AdminClientesPage from './pages/AdminClientesPage';
import NovoClientePage from './pages/NovoClientePage';
import AdminRelatoriosPage from './pages/AdminRelatoriosPage';
import SecurityPage from './pages/SecurityPage';
import VendasPage from './pages/VendasPage';
import TarefasPage from './pages/TarefasPage';
import CalendarioPage from './pages/CalendarioPage';
import ComunicacaoPage from './pages/ComunicacaoPage';
import AutomacoesPage from './pages/AutomacoesPage';

function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <MainLayout>
      <Outlet />
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
            element={usuario?.role === 'admin' ? <AdminDashboard /> : <ClientDashboard />}
          />
          <Route path="/admin/clientes" element={<AdminClientesPage />} />
          <Route path="/admin/clientes/novo" element={<NovoClientePage />} />
          <Route path="/admin/relatorios" element={<AdminRelatoriosPage />} />
          <Route path="/configuracoes/seguranca" element={<SecurityPage />} />
          <Route path="/configuracoes/usuarios" element={<PermissoesPage />} />
          <Route path="/configuracoes/planos" element={<PlanosPage />} />
          <Route path="/cliente" element={<ClientePage />} />
          <Route path="/vendas" element={<VendasPage />} />
          <Route path="/tarefas" element={<TarefasPage />} />
          <Route path="/calendario" element={<CalendarioPage />} />
          <Route path="/comunicacao" element={<ComunicacaoPage />} />
          <Route path="/automacoes" element={<AutomacoesPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
