import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: { usuario: { id: number; email: string; role: string } }) => unknown) =>
    selector({ usuario: { id: 1, email: 'admin@cliente1.com', role: 'admin' } }),
}));

vi.mock('../api/client', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({
      data: {
        secret: 'ABCDEFGHIJKLMNOP',
        qrCode: 'data:image/png;base64,fake',
        backupCodes: ['AABB', 'CCDD', 'EEFF'],
      },
    })),
  },
}));

import { SecurityPage } from './SecurityPage';

function renderPage() {
  return render(<MemoryRouter><SecurityPage /></MemoryRouter>);
}

describe('SecurityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe título de segurança', () => {
    renderPage();
    expect(screen.getByText('Segurança da Conta')).toBeTruthy();
  });

  it('exibe email do usuário autenticado', () => {
    renderPage();
    expect(screen.getByText(/admin@cliente1\.com/)).toBeTruthy();
  });

  it('exibe botões de configuração 2FA', () => {
    renderPage();
    expect(screen.getByText(/Configurar Authenticator/i)).toBeTruthy();
    expect(screen.getByText(/Configurar SMS/i)).toBeTruthy();
  });
});
