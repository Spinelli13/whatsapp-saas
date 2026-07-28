import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import apiClient from '../services/apiClient';

interface Tarefa {
  id: string;
  titulo: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  vencimento: string | null;
}

const prioridadeColor: Record<string, string> = {
  urgente: '#ef4444',
  alta: '#f97316',
  media: '#eab308',
  baixa: '#22c55e',
};

export default function TarefasScreen() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = async () => {
    try {
      const res = await apiClient.get<Tarefa[]>('/tarefas');
      setTarefas(res.data);
    } catch {
      // show cached or empty
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#06b6d4" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minhas Tarefas</Text>
      <FlatList
        data={tarefas}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} tintColor="#06b6d4" />}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma tarefa encontrada</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderLeftColor: prioridadeColor[item.prioridade] ?? '#94a3b8' }]}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardMeta}>
              {item.status.replace('_', ' ')} · {item.vencimento ? new Date(item.vencimento).toLocaleDateString('pt-BR') : 'Sem prazo'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 16 },
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 10, marginBottom: 10, borderLeftWidth: 3 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  cardMeta: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40 },
});
