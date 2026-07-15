import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: { usuario: { id: number; email: string; nome: string; cliente_id: number; role: string } }) => unknown) =>
    selector({ usuario: { id: 1, email: 'admin@cliente1.com', nome: 'Admin', cliente_id: 1, role: 'admin' } }),
}));

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn((url: string) => {
      const planos = [
        { id: 1, nome: 'basico', descricao: 'Básico', preco_mensal: 99, usuarios_limite: 1, mensagens_limite: 1000, departamentos_limite: 1, features: ['fila_visualizar'] },
        { id: 2, nome: 'profissional', descricao: 'Pro', preco_mensal: 299, usuarios_limite: 5, mensagens_limite: 10000, departamentos_limite: 3, features: ['fila_visualizar', 'fila_responder'] },
        { id: 3, nome: 'enterprise', descricao: 'Enterprise', preco_mensal: 999, usuarios_limite: 999999, mensagens_limite: 999999, departamentos_limite: 999999, features: ['*'] },
      ];
      if (url === '/planos/disponibles') return Promise.resolve({ data: planos });
      if (url === '/planos/meu-plano') return Promise.resolve({ data: { id: 1, plano_id: 2, cliente_id: 1, status: 'ativo', Plano: planos[1] } });
      if (url === '/planos/meu-uso') return Promise.resolve({ data: {
        uso: { mensagens_usadas: 50, usuarios_criados: 1, departamentos_criados: 0 },
        limites: {
          mensagens: { usado: 50, limite: 10000, atingiu: false },
          usuarios: { usado: 1, limite: 5, atingiu: false },
          departamentos: { usado: 0, limite: 3, atingiu: false },
        },
      } });
      return Promise.resolve({ data: {} });
    }),
  },
}));

import { PlanosPage } from './PlanosPage';

function renderPage() {
  return render(<MemoryRouter><PlanosPage /></MemoryRouter>);
}

describe('PlanosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe título da página', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Seus Planos')).toBeTruthy();
    });
  });

  it('lista os planos disponíveis', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('basico')).toBeTruthy();
      expect(screen.getByText('enterprise')).toBeTruthy();
    });
  });

  it('exibe seção de uso com as três dimensões', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Mensagens')).toBeTruthy();
      expect(screen.getByText('Usuários')).toBeTruthy();
      expect(screen.getByText('Departamentos')).toBeTruthy();
    });
  });
});
