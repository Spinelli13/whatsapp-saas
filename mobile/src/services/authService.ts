import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UsuarioInfo {
  id: number;
  nome: string;
  email: string;
  cliente_id: number;
}

export interface AuthResponse {
  token: string;
  usuario: UsuarioInfo;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    const { token, usuario } = response.data;
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('usuario', JSON.stringify(usuario));
    return { token, usuario };
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('usuario');
  },

  async getStoredAuth(): Promise<AuthResponse | null> {
    const token = await AsyncStorage.getItem('authToken');
    const usuarioStr = await AsyncStorage.getItem('usuario');
    if (!token || !usuarioStr) return null;
    return { token, usuario: JSON.parse(usuarioStr) };
  },

  async refreshToken(token: string): Promise<string> {
    const response = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const newToken = response.data.token;
    await AsyncStorage.setItem('authToken', newToken);
    return newToken;
  },
};
