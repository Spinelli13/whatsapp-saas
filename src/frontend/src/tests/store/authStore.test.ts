import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../store/authStore';

const mockUser = {
  id: 1,
  email: 'admin@cliente1.com',
  nome: 'Admin',
  cliente_id: 1,
  role: 'admin',
};

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ token: null, usuario: null, isAuthenticated: false });
  });

  it('estado inicial: não autenticado', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.usuario).toBeNull();
  });

  it('login atualiza estado corretamente', () => {
    useAuthStore.getState().login('token-abc-123', mockUser);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('token-abc-123');
    expect(state.usuario?.email).toBe('admin@cliente1.com');
    expect(state.usuario?.cliente_id).toBe(1);
  });

  it('logout limpa o estado', () => {
    useAuthStore.getState().login('token-abc-123', mockUser);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.usuario).toBeNull();
  });
});
