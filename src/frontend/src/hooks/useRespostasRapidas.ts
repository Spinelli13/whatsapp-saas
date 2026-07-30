import { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';

export interface RespostaRapida {
  id: string;
  titulo: string;
  conteudo: string;
  atalho?: string;
}

export function useRespostasRapidas() {
  const [respostas, setRespostas] = useState<RespostaRapida[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<{ data: RespostaRapida[] }>('/respostas-rapidas');
      setRespostas(data.data ?? []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao carregar respostas rápidas');
      setRespostas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const criar = async (titulo: string, conteudo: string, atalho?: string) => {
    const { data } = await apiClient.post<{ data: RespostaRapida }>('/respostas-rapidas', {
      titulo,
      conteudo,
      atalho: atalho || undefined,
    });
    setRespostas((prev) => [...prev, data.data].sort((a, b) => a.titulo.localeCompare(b.titulo)));
    return data.data;
  };

  const atualizar = async (id: string, titulo: string, conteudo: string, atalho?: string) => {
    const { data } = await apiClient.put<{ data: RespostaRapida }>(`/respostas-rapidas/${id}`, {
      titulo,
      conteudo,
      atalho: atalho || null,
    });
    setRespostas((prev) =>
      prev.map((r) => (r.id === id ? data.data : r)).sort((a, b) => a.titulo.localeCompare(b.titulo))
    );
    return data.data;
  };

  const deletar = async (id: string) => {
    await apiClient.delete(`/respostas-rapidas/${id}`);
    setRespostas((prev) => prev.filter((r) => r.id !== id));
  };

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { respostas, loading, error, criar, atualizar, deletar, carregar };
}
