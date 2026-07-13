import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../../components/ui/Button';

describe('Button', () => {
  it('renderiza o texto corretamente', () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByRole('button', { name: 'Clique aqui' })).toBeInTheDocument();
  });

  it('fica desabilitado quando loading=true', () => {
    render(<Button loading>Enviando</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('fica desabilitado quando disabled=true', () => {
    render(<Button disabled>Desabilitado</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('aplica variante danger com classe correta', () => {
    render(<Button variant="danger">Excluir</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
