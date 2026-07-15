import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilaList } from '../../components/dashboard/FilaList';

describe('FilaList', () => {
  it('deve renderizar o título da fila', () => {
    render(<FilaList clienteId={1} />);
    expect(screen.getByText('Fila de Mensagens')).toBeInTheDocument();
  });

  it('deve exibir o contador de tickets', async () => {
    render(<FilaList clienteId={1} />);
    const contador = await screen.findByText(/ticket/i);
    expect(contador).toBeInTheDocument();
  });
});
