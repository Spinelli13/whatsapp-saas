import { useEffect, useState } from 'react';
import apiClient from '../api/client';

export interface FluxoBot {
  id: string;
  cliente_id: number;
  nome: string;
  descricao?: string;
  estrutura_json: { nodes: any[]; edges: any[] };
  mensagem_saudacao?: string;
  mensagem_despedida?: string;
  ativo: boolean;
  criado_em: string;
}

export function useFluxosBot() {
  const [fluxos, setFluxos] = useState<FluxoBot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/chatbot/fluxos');
      setFluxos(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  const criar = async (nome: string, descricao?: string) => {
    const { data } = await apiClient.post('/chatbot/fluxos', { nome, descricao });
    setFluxos((prev) => [...prev, data.data]);
    return data.data as FluxoBot;
  };

  const atualizar = async (id: string, dados: Partial<FluxoBot>) => {
    const { data } = await apiClient.put(`/chatbot/fluxos/${id}`, dados);
    setFluxos((prev) => prev.map((f) => (f.id === id ? data.data : f)));
    return data.data as FluxoBot;
  };

  const ativar = async (id: string) => {
    const { data } = await apiClient.patch(`/chatbot/fluxos/${id}/ativar`);
    setFluxos((prev) => prev.map((f) => ({ ...f, ativo: f.id === id })));
    return data.data as FluxoBot;
  };

  const deletar = async (id: string) => {
    await apiClient.delete(`/chatbot/fluxos/${id}`);
    setFluxos((prev) => prev.filter((f) => f.id !== id));
  };

  const testar = async (estrutura: { nodes: any[]; edges: any[] }, respostaUsuario: string) => {
    const { data } = await apiClient.post('/chatbot/testar', {
      estrutura_json: estrutura,
      resposta_usuario: respostaUsuario,
    });
    return data.data;
  };

  useEffect(() => {
    carregar();
  }, []);

  return { fluxos, loading, error, criar, atualizar, ativar, deletar, testar, carregar };
}
