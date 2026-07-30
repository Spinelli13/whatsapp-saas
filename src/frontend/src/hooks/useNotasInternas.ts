import { useEffect, useState } from 'react';
import apiClient from '../api/client';

export interface NotaInterna {
  id: string;
  atendimento_id: string;
  usuario_id: number;
  conteudo: string;
  autor?: {
    id: number;
    nome: string;
    email: string;
  };
  criado_em: string;
}

export function useNotasInternas(atendimentoId: string | undefined) {
  const [notas, setNotas] = useState<NotaInterna[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregar = async () => {
    if (!atendimentoId) return;
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/atendimento/${atendimentoId}/notas`);
      setNotas(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao carregar notas');
      setNotas([]);
    } finally {
      setLoading(false);
    }
  };

  const criar = async (conteudo: string) => {
    if (!atendimentoId) return;
    const { data } = await apiClient.post(`/atendimento/${atendimentoId}/notas`, { conteudo });
    setNotas((prev) => [...prev, data.data]);
    return data.data;
  };

  const deletar = async (notaId: string) => {
    await apiClient.delete(`/atendimento/nota/${notaId}`);
    setNotas((prev) => prev.filter((n) => n.id !== notaId));
  };

  useEffect(() => {
    if (atendimentoId) {
      carregar();
    } else {
      setNotas([]);
    }
  }, [atendimentoId]);

  return { notas, loading, error, criar, deletar, carregar };
}
