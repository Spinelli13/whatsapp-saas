import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';
import type { RootState } from '../store';

interface Oportunidade {
  id: string;
  titulo: string;
  valor: string;
  status: string;
  estagio?: { nome: string };
}

const CACHE_KEY = 'oportunidades_cache';

export default function HomeScreen() {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const usuario = useSelector((state: RootState) => state.auth.usuario);

  const carregarOportunidades = useCallback(async () => {
    try {
      const response = await apiClient.get<Oportunidade[]>('/vendas/oportunidades');
      const data = response.data;
      setOportunidades(data);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) setOportunidades(JSON.parse(cached));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarOportunidades();
  }, [carregarOportunidades]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarOportunidades();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá, {usuario?.nome ?? 'usuário'}</Text>
      <Text style={styles.subtitle}>{oportunidades.length} oportunidades ativas</Text>

      <FlatList
        data={oportunidades}
        keyExtractor={(item) => item.id}
        contentContainerStyle={oportunidades.length === 0 ? styles.emptyList : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06b6d4" />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma oportunidade encontrada</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.emptyLink}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardValor}>R$ {item.valor}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.estagio?.nome ?? item.status}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  card: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#06b6d4',
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#f1f5f9', marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardValor: { fontSize: 14, color: '#06b6d4', fontWeight: '600' },
  statusBadge: { backgroundColor: '#0e4a5a', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 12, color: '#22d3ee' },
  emptyList: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#64748b', fontSize: 15, marginBottom: 12 },
  emptyLink: { color: '#06b6d4', fontSize: 14, fontWeight: '600' },
});
