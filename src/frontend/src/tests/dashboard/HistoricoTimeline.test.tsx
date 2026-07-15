import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoricoTimeline } from '../../components/dashboard/HistoricoTimeline';

describe('HistoricoTimeline', () => {
  it('deve renderizar o título "Histórico"', () => {
    render(<HistoricoTimeline ticketId={null} />);
    expect(screen.getByText('Histórico')).toBeInTheDocument();
  });

  it('deve mostrar mensagem quando nenhum ticket selecionado', () => {
    render(<HistoricoTimeline ticketId={null} />);
    expect(screen.getByText(/selecione um ticket/i)).toBeInTheDocument();
  });
});
