import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Mock axios before importing authService
jest.mock('axios');

import { authService } from '../src/services/authService';

const mockAxios = axios as jest.Mocked<typeof axios>;

const mockUsuario = { id: 1, nome: 'Test User', email: 'test@test.com', cliente_id: 1 };
const mockToken = 'jwt-token-abc123';

// Reset AsyncStorage mock storage between tests
beforeEach(() => {
  (AsyncStorage as any)._reset();
  jest.clearAllMocks();
});

describe('authService.login()', () => {
  it('calls POST /auth/login with credentials', async () => {
    mockAxios.post = jest.fn().mockResolvedValueOnce({
      data: { token: mockToken, usuario: mockUsuario },
    });

    await authService.login({ email: 'test@test.com', password: '123456' });

    expect(mockAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      { email: 'test@test.com', password: '123456' }
    );
  });

  it('stores token and usuario in AsyncStorage', async () => {
    mockAxios.post = jest.fn().mockResolvedValueOnce({
      data: { token: mockToken, usuario: mockUsuario },
    });

    await authService.login({ email: 'test@test.com', password: '123456' });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('authToken', mockToken);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('usuario', JSON.stringify(mockUsuario));
  });

  it('returns token and usuario', async () => {
    mockAxios.post = jest.fn().mockResolvedValueOnce({
      data: { token: mockToken, usuario: mockUsuario },
    });

    const result = await authService.login({ email: 'test@test.com', password: '123456' });

    expect(result.token).toBe(mockToken);
    expect(result.usuario).toEqual(mockUsuario);
  });

  it('propagates axios error on failed login', async () => {
    mockAxios.post = jest.fn().mockRejectedValueOnce(new Error('Network Error'));

    await expect(authService.login({ email: 'x', password: 'y' })).rejects.toThrow('Network Error');
  });
});

describe('authService.logout()', () => {
  it('removes authToken and usuario from AsyncStorage', async () => {
    await authService.logout();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('usuario');
  });
});

describe('authService.getStoredAuth()', () => {
  it('returns null when no token stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const result = await authService.getStoredAuth();
    expect(result).toBeNull();
  });

  it('returns auth data when both token and usuario are stored', async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(mockToken)
      .mockResolvedValueOnce(JSON.stringify(mockUsuario));

    const result = await authService.getStoredAuth();
    expect(result).not.toBeNull();
    expect(result!.token).toBe(mockToken);
    expect(result!.usuario).toEqual(mockUsuario);
  });

  it('returns null when token missing but usuario present', async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify(mockUsuario));

    const result = await authService.getStoredAuth();
    expect(result).toBeNull();
  });
});

describe('authService.refreshToken()', () => {
  it('calls POST /auth/refresh with Bearer token', async () => {
    const newToken = 'new-token-xyz';
    mockAxios.post = jest.fn().mockResolvedValueOnce({ data: { token: newToken } });

    const result = await authService.refreshToken(mockToken);

    expect(mockAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      {},
      { headers: { Authorization: `Bearer ${mockToken}` } }
    );
    expect(result).toBe(newToken);
  });

  it('stores new token in AsyncStorage after refresh', async () => {
    const newToken = 'refreshed-token';
    mockAxios.post = jest.fn().mockResolvedValueOnce({ data: { token: newToken } });

    await authService.refreshToken(mockToken);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('authToken', newToken);
  });

  it('propagates error on refresh failure', async () => {
    mockAxios.post = jest.fn().mockRejectedValueOnce(new Error('Unauthorized'));

    await expect(authService.refreshToken(mockToken)).rejects.toThrow('Unauthorized');
  });
});
