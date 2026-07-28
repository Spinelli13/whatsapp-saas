import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/authSlice';
import type { AppDispatch, RootState } from '../store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Email e senha são obrigatórios');
      return;
    }
    dispatch(loginUser({ email: email.trim(), password }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CRM Mobile</Text>
      <Text style={styles.subtitle}>WhatsApp SaaS</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
        testID="email-input"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#9ca3af"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
        testID="password-input"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
        testID="login-button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#06b6d4',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f1f5f9',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#06b6d4',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: {
    color: '#f87171',
    marginBottom: 14,
    textAlign: 'center',
    fontSize: 13,
  },
});
