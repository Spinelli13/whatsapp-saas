import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import apiClient from '../services/apiClient';

interface Pipeline {
  id: string;
  nome: string;
  oportunidades_count: number;
  valor_total: string;
}

export default function VendasScreen() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = async () => {
    try {
      const res = await apiClient.get<Pipeline[]>('/vendas/pipelines');
      setPipelines(res.data);
    } catch {
      // use cached data or show empty
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
      <Text style={styles.title}>Pipelines de Vendas</Text>
      <FlatList
        data={pipelines}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} tintColor="#06b6d4" />}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum pipeline encontrado</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.nome}</Text>
            <Text style={styles.cardMeta}>{item.oportunidades_count} oportunidades · R$ {item.valor_total}</Text>
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
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 10, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  cardMeta: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40 },
});
