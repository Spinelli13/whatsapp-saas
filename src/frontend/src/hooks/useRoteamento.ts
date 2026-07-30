import { useEffect, useState } from 'react';
import apiClient from '../api/client';

export interface ConfigRoteamento {
  id: string;
  departamento_id?: number | null;
  tipo_roteamento: 'round_robin' | 'least_busy' | 'skill' | 'manual';
  limite_simultaneos: number;
  tempo_sla_minutos: number;
  habilitar_transbordo: boolean;
  ativo: boolean;
}

export interface Skill {
  id: string;
  nome_skill: string;
  nivel: 'basico' | 'intermediario' | 'avancado';
}

export function useRoteamento() {
  const [configs, setConfigs] = useState<ConfigRoteamento[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarConfigs = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/roteamento/config');
      setConfigs(data.data || []);
    } catch (err) {
      console.error('Erro ao carregar configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const carregarSkills = async () => {
    try {
      const { data } = await apiClient.get('/roteamento/skills');
      setSkills(data.data || []);
    } catch (err) {
      console.error('Erro ao carregar skills:', err);
    }
  };

  const criarConfig = async (dados: Partial<ConfigRoteamento>) => {
    const { data } = await apiClient.post('/roteamento/config', dados);
    setConfigs((prev) => [...prev, data.data]);
    return data.data;
  };

  const atualizarConfig = async (id: string, dados: Partial<ConfigRoteamento>) => {
    const { data } = await apiClient.put(`/roteamento/config/${id}`, dados);
    setConfigs((prev) => prev.map((c) => (c.id === id ? data.data : c)));
    return data.data;
  };

  const adicionarSkill = async (nomeSkill: string, nivel: string) => {
    const { data } = await apiClient.post('/roteamento/skill', { nome_skill: nomeSkill, nivel });
    setSkills((prev) => [...prev, data.data]);
    return data.data;
  };

  const deletarSkill = async (id: string) => {
    await apiClient.delete(`/roteamento/skill/${id}`);
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  useEffect(() => {
    carregarConfigs();
    carregarSkills();
  }, []);

  return { configs, skills, loading, criarConfig, atualizarConfig, adicionarSkill, deletarSkill };
}
