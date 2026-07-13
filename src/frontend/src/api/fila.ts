import { apiClient } from './client';
import type { TicketStatus } from '@shared/types/ticket';

export const filaApi = {
  getDepartamentos: (clienteId: number) =>
    apiClient.get(`/fila/departamentos/${clienteId}`),

  getStatus: (clienteId: number, departamentoId?: number) =>
    apiClient.get(`/fila/status/${clienteId}`, {
      params: departamentoId ? { departamento: departamentoId } : undefined,
    }),

  getHistorico: (ticketId: string) =>
    apiClient.get(`/fila/tickets/${ticketId}/historico`),

  adicionarNota: (ticketId: string, conteudo: string, privada = false) =>
    apiClient.post(`/fila/tickets/${ticketId}/notas`, { conteudo, privada }),

  mudarStatus: (ticketId: string, status: TicketStatus) =>
    apiClient.put(`/fila/tickets/${ticketId}/status`, { status }),

  adicionarSatisfacao: (ticketId: string, rating: 1 | 2 | 3 | 4 | 5) =>
    apiClient.post(`/fila/tickets/${ticketId}/satisfacao`, { rating }),
};
