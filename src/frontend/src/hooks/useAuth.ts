import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { disconnectSocket } from '../socket/client';

export function useAuth() {
  const { token, usuario, isAuthenticated, login: storeLogin, logout: storeLogout } =
    useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (email: string, senha: string) => {
      const { data } = await authApi.login({ email, senha });
      storeLogin(data.token, data.usuario);
      navigate('/dashboard');
      return data;
    },
    [storeLogin, navigate]
  );

  const logout = useCallback(() => {
    disconnectSocket();
    storeLogout();
    navigate('/login');
  }, [storeLogout, navigate]);

  return { token, usuario, isAuthenticated, login, logout };
}
