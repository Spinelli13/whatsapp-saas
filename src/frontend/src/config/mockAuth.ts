export interface MockUser {
  id: number;
  email: string;
  senha: string;
  nome: string;
  cliente_id: number;
  role: string;
}

export const MOCK_CREDENTIALS: MockUser[] = [
  { id: 1, email: 'admin@cliente1.com', senha: 'password123', nome: 'Admin Cliente 1', cliente_id: 1, role: 'admin' },
  { id: 2, email: 'ana@cliente1.com', senha: 'password123', nome: 'Ana Costa', cliente_id: 1, role: 'atendente' },
  { id: 3, email: 'bruno@cliente1.com', senha: 'password123', nome: 'Bruno Lima', cliente_id: 1, role: 'atendente' },
  { id: 4, email: 'admin@barcos.com', senha: 'password123', nome: 'Admin Barcos', cliente_id: 2, role: 'admin' },
  { id: 5, email: 'carlos@barcos.com', senha: 'password123', nome: 'Carlos Dias', cliente_id: 2, role: 'atendente' },
];

export function getMockToken(user: MockUser): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(
    JSON.stringify({
      id: user.id,
      email: user.email,
      cliente_id: user.cliente_id,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    })
  ).replace(/=/g, '');
  return `${header}.${payload}.mock-signature`;
}

export const IS_MOCK_AUTH = import.meta.env.VITE_MOCK_AUTH === 'true';
