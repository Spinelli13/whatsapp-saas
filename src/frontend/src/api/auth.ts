import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface Usuario {
  id: number;
  email: string;
  nome: string;
  cliente_id: number;
  role: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<LoginResponse>('/auth/login', credentials),

  verify: () =>
    apiClient.get<{ usuario: Usuario }>('/auth/verify'),
};
