import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';

export type StatusAtendente = 'online' | 'ausente' | 'offline';

export interface AtendenteStatus {
  id: number;
  nome: string;
  email: string;
  role: string;
  status_atendente: StatusAtendente;
}

export function useStatusAtendente() {
  const usuario = useAuthStore((s) => s.usuario);
  const [status, setStatus] = useState<StatusAtendente>('offline');
  const [loading, setLoading] = useState(false);
  const [atendentes, setAtendentes] = useState<AtendenteStatus[]>([]);

  const carregar = async () => {
    if (!usuario?.id) return;
    try {
      const { data } = await apiClient.get(`/atendente/${usuario.id}/status`);
      setStatus(data.data.status_atendente);
    } catch {
      // silencioso — campo pode não existir ainda
    }
  };

  const mudar = async (novoStatus: StatusAtendente) => {
    if (!usuario?.id) return;
    try {
      setLoading(true);
      const { data } = await apiClient.patch(`/atendente/${usuario.id}/status`, {
        status: novoStatus,
      });
      setStatus(data.data.status_atendente);
      return data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.erro || 'Erro ao mudar status');
    } finally {
      setLoading(false);
    }
  };

  const listarAtendentes = async (filtroStatus?: StatusAtendente) => {
    try {
      const params = filtroStatus ? { status: filtroStatus } : {};
      const { data } = await apiClient.get('/atendente/listar', { params });
      setAtendentes(data.data || []);
      return data.data as AtendenteStatus[];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    carregar();
  }, [usuario?.id]);

  return { status, mudar, loading, atendentes, listarAtendentes };
}
