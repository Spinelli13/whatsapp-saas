import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export interface Transferencia {
  id: string;
  atendimento_id: string;
  atendente_origem_id: number;
  atendente_destino_id: number;
  motivo: string | null;
  status: 'pendente' | 'aceita' | 'rejeitada' | 'cancelada';
  departamento_destino_id: number | null;
  mensagem_rejeicao: string | null;
  criado_em: string;
  atendimento?: { id: string; numero_whatsapp: string; nome_cliente: string; status: string };
  origem?: { id: number; nome: string; email: string };
  destino?: { id: number; nome: string; email: string };
}

export function useTransferencias() {
  const { token } = useAuthStore();
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [pendentes, setPendentes] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const listar = useCallback(async (atendimento_id?: string, status?: string) => {
    setLoading(true);
    setErro(null);
    try {
      const params = new URLSearchParams();
      if (atendimento_id) params.set('atendimento_id', atendimento_id);
      if (status) params.set('status', status);
      const res = await fetch(`/api/transferencia?${params}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.erro || 'Erro ao listar transferências');
      setTransferencias(json.data);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const carregarPendentes = useCallback(async () => {
    try {
      const res = await fetch('/api/transferencia/pendentes', { headers });
      const json = await res.json();
      if (res.ok) setPendentes(json.data);
    } catch {
      // silencioso — polling em background
    }
  }, [token]);

  const solicitar = useCallback(async (payload: {
    atendimento_id: string;
    atendente_destino_id: number;
    motivo?: string;
    departamento_destino_id?: number;
  }) => {
    setErro(null);
    const res = await fetch('/api/transferencia/solicitar', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.erro || 'Erro ao solicitar transferência');
    return json.data as Transferencia;
  }, [token]);

  const aceitar = useCallback(async (id: string) => {
    const res = await fetch(`/api/transferencia/${id}/aceitar`, { method: 'PATCH', headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json.erro || 'Erro ao aceitar transferência');
    setPendentes((prev) => prev.filter((t) => t.id !== id));
    return json.data as Transferencia;
  }, [token]);

  const rejeitar = useCallback(async (id: string, motivo?: string) => {
    const res = await fetch(`/api/transferencia/${id}/rejeitar`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ motivo }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.erro || 'Erro ao rejeitar transferência');
    setPendentes((prev) => prev.filter((t) => t.id !== id));
    return json.data as Transferencia;
  }, [token]);

  const cancelar = useCallback(async (id: string) => {
    const res = await fetch(`/api/transferencia/${id}/cancelar`, { method: 'PATCH', headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json.erro || 'Erro ao cancelar transferência');
    setTransferencias((prev) => prev.map((t) => (t.id === id ? json.data : t)));
    return json.data as Transferencia;
  }, [token]);

  return {
    transferencias,
    pendentes,
    loading,
    erro,
    listar,
    carregarPendentes,
    solicitar,
    aceitar,
    rejeitar,
    cancelar,
  };
}
