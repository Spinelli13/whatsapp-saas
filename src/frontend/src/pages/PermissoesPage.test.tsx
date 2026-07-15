import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mutable ref so individual tests can swap the role
let mockRole = 'admin';

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: { usuario: { id: number; email: string; nome: string; cliente_id: number; role: string } }) => unknown) =>
    selector({ usuario: { id: 1, email: 'admin@cliente1.com', nome: 'Admin', cliente_id: 1, role: mockRole } }),
}));

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url === '/roles') {
        return Promise.resolve({
          data: {
            roles: [
              { id: 1, nome: 'admin', descricao: 'Admin', eh_customizado: false, Permissaos: [{ id: 1, nome: 'fila.visualizar', descricao: 'Ver fila', categoria: 'fila' }] },
              { id: 2, nome: 'atendente', descricao: 'Atendente', eh_customizado: false, Permissaos: [] },
            ],
          },
        });
      }
      if (url === '/roles/permissoes/listar') {
        return Promise.resolve({
          data: {
            por_categoria: {
              fila: [{ id: 1, nome: 'fila.visualizar', descricao: 'Ver fila de mensagens', categoria: 'fila' }],
            },
          },
        });
      }
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Import after mocks are set up
import { PermissoesPage } from './PermissoesPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <PermissoesPage />
    </MemoryRouter>
  );
}

describe('PermissoesPage', () => {
  beforeEach(() => {
    mockRole = 'admin';
    vi.clearAllMocks();
  });

  it('exibe título da página', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Gerenciar Roles e Permissões')).toBeTruthy();
    });
  });

  it('lista roles carregadas da API', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeTruthy();
      expect(screen.getByText('atendente')).toBeTruthy();
    });
  });

  it('bloqueia acesso para usuários não-admin', async () => {
    mockRole = 'atendente';
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Acesso restrito/i)).toBeTruthy();
    });
  });
});
