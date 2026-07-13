export type TicketStatus = 'novo' | 'respondendo' | 'resolvido' | 'fechado' | 'reaberto';

export type HistoricoAcao =
  | 'criado'
  | 'status_alterado'
  | 'nota_adicionada'
  | 'respondido'
  | 'transferido'
  | 'fechado'
  | 'reaberto'
  | 'rating_adicionado';

export const TICKET_STATUS: Record<string, TicketStatus> = {
  NOVO: 'novo',
  RESPONDENDO: 'respondendo',
  RESOLVIDO: 'resolvido',
  FECHADO: 'fechado',
  REABERTO: 'reaberto',
} as const;

export interface Ticket {
  id: string;
  cliente_id: number;
  departamento_id: number;
  telefone: string;
  texto: string;
  /** Status operacional da fila */
  status: 'aguardando' | 'atribuido' | 'fechado';
  /** Status do ciclo de vida do ticket */
  ticket_status: TicketStatus;
  atendente_id?: number;
  posicao_fila?: number;
  satisfaction_rating?: number;
  respondido_por?: number;
  respondido_em?: string;
  created_at: string;
  updated_at: string;
}

export interface NotaTicket {
  id: string;
  ticket_id: string;
  usuario_id: number;
  conteudo: string;
  privada: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface HistoricoTicket {
  id: string;
  ticket_id: string;
  usuario_id?: number;
  acao: HistoricoAcao;
  dados_anteriores?: Record<string, unknown>;
  dados_novos?: Record<string, unknown>;
  criado_em: string;
}

export interface HistoricoCompleto {
  ticket: Ticket;
  notas: NotaTicket[];
  historico: HistoricoTicket[];
}

export interface CriarNotaBody {
  conteudo: string;
  privada?: boolean;
}

export interface MudarStatusBody {
  status: TicketStatus;
}

export interface AdicionarSatisfacaoBody {
  rating: 1 | 2 | 3 | 4 | 5;
}
