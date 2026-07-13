import { create } from 'zustand';
import type { Ticket } from '@shared/types/ticket';

interface FilaState {
  fila: Ticket[];
  resumo: Record<string, unknown>;
  loading: boolean;
  setFila: (fila: Ticket[]) => void;
  setResumo: (resumo: Record<string, unknown>) => void;
  setLoading: (loading: boolean) => void;
  adicionarEntrada: (entrada: Ticket) => void;
  removerEntrada: (id: string) => void;
}

export const useFilaStore = create<FilaState>((set) => ({
  fila: [],
  resumo: {},
  loading: false,
  setFila: (fila) => set({ fila }),
  setResumo: (resumo) => set({ resumo }),
  setLoading: (loading) => set({ loading }),
  adicionarEntrada: (entrada) =>
    set((state) => ({ fila: [...state.fila, entrada] })),
  removerEntrada: (id) =>
    set((state) => ({ fila: state.fila.filter((e) => e.id !== id) })),
}));
