import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { disconnectSocket } from '../socket/client';
import { IS_MOCK_AUTH, MOCK_CREDENTIALS, getMockToken } from '../config/mockAuth';

export function useAuth() {
  const { token, usuario, isAuthenticated, login: storeLogin, logout: storeLogout } =
    useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (email: string, senha: string) => {
      if (IS_MOCK_AUTH) {
        const mockUser = MOCK_CREDENTIALS.find(
          (u) => u.email === email && u.senha === senha
        );
        if (!mockUser) throw new Error('Credenciais inválidas');
        const mockToken = getMockToken(mockUser);
        const mockUsuario = {
          id: mockUser.id,
          email: mockUser.email,
          nome: mockUser.nome,
          cliente_id: mockUser.cliente_id,
          role: mockUser.role,
        };
        storeLogin(mockToken, mockUsuario);
        navigate('/dashboard');
        return { token: mockToken, usuario: mockUsuario };
      }

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
