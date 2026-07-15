import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientePage from './pages/ClientePage';
import PermissoesPage from './pages/PermissoesPage';
import PlanosPage from './pages/PlanosPage';
import AdminClientesPage from './pages/AdminClientesPage';
import SecurityPage from './pages/SecurityPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cliente"
          element={
            <PrivateRoute>
              <ClientePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/permissoes"
          element={
            <PrivateRoute>
              <PermissoesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/planos"
          element={
            <PrivateRoute>
              <PlanosPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/clientes"
          element={
            <PrivateRoute>
              <AdminClientesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/security"
          element={
            <PrivateRoute>
              <SecurityPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
