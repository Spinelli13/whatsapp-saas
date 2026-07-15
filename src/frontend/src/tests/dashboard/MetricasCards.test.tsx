import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricasCards } from '../../components/dashboard/MetricasCards';

describe('MetricasCards', () => {
  it('deve renderizar 4 cards de métricas', () => {
    render(<MetricasCards />);
    const cards = screen.getAllByText(/tickets hoje|em atendimento|resolvidos|satisfação média/i);
    expect(cards).toHaveLength(4);
  });

  it('deve exibir os labels corretos', () => {
    render(<MetricasCards />);
    expect(screen.getByText('Tickets Hoje')).toBeInTheDocument();
    expect(screen.getByText('Em Atendimento')).toBeInTheDocument();
    expect(screen.getByText('Resolvidos')).toBeInTheDocument();
    expect(screen.getByText('Satisfação Média')).toBeInTheDocument();
  });
});
