import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConexaoWhatsApp } from './ConexaoWhatsApp';

describe('ConexaoWhatsApp', () => {
  it('deve renderizar título do componente', () => {
    render(<ConexaoWhatsApp />);
    expect(screen.getByText(/Conexão WhatsApp/i)).toBeInTheDocument();
  });

  it('deve ter botão para gerar QR code', () => {
    render(<ConexaoWhatsApp />);
    expect(screen.getByText('Gerar QR Code')).toBeInTheDocument();
  });
});
