import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MinhasNotas } from './MinhasNotas';

describe('MinhasNotas', () => {
  it('deve renderizar título do painel de notas', () => {
    render(<MinhasNotas clienteId={1} />);
    expect(screen.getByText(/Notas sobre Minhas Conversas/i)).toBeInTheDocument();
  });
});
