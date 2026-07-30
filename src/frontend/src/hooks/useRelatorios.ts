import { useState } from 'react';
import apiClient from '../api/client';

export interface DashboardData {
  metricas_gerais: {
    tme_segundos: number;
    tma_segundos: number;
    tempo_primeira_resposta_segundos: number;
  };
  volume_por_periodo: { periodo: string; total: number }[];
  top_atendentes: {
    usuario_id: number;
    usuario: { id: number; nome: string; email: string } | null;
    total_atendimentos: number;
    tma_segundos: number;
    tme_segundos: number;
    total_mensagens: number;
  }[];
  performance_departamentos: {
    departamento_id: number;
    departamento: { id: number; nome: string } | null;
    total: number;
    tma_segundos: number;
  }[];
  satisfacao: {
    csat_media: string;
    nps_media: string;
    total_avaliacoes: number;
  };
}

export function useRelatorios() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const carregar = async () => {
    if (!dataInicio || !dataFim) return;
    try {
      setLoading(true);
      const { data } = await apiClient.get('/relatorio/dashboard', { params: { dataInicio, dataFim } });
      setDashboard(data.data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = async () => {
    if (!dataInicio || !dataFim) return;
    try {
      const response = await apiClient.get('/relatorio/export/csv', {
        params: { dataInicio, dataFim },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Erro ao exportar:', err);
    }
  };

  return { dashboard, loading, dataInicio, setDataInicio, dataFim, setDataFim, carregar, exportarCSV };
}
