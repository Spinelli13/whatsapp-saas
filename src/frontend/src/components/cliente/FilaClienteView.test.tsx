import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilaClienteView } from './FilaClienteView';

describe('FilaClienteView', () => {
  it('deve renderizar título Minhas Conversas', () => {
    render(<FilaClienteView clienteId={1} />);
    expect(screen.getByText(/Minhas Conversas/i)).toBeInTheDocument();
  });
});
