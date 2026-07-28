// Pure Redux reducer tests — no mocks needed, pure functions only
import authReducer, {
  logout,
  clearError,
  loginUser,
  restoreToken,
  logoutUser,
  AuthState,
} from '../src/store/authSlice';

const initialState: AuthState = {
  isAuthenticated: false,
  usuario: null,
  token: null,
  loading: false,
  error: null,
};

const mockUsuario = { id: 1, nome: 'Test User', email: 'test@test.com', cliente_id: 1 };
const mockPayload = { token: 'test-token-abc', usuario: mockUsuario };

describe('authSlice — initial state', () => {
  it('returns initial state on unknown action', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.usuario).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe('authSlice — loginUser thunk', () => {
  it('loginUser.pending: sets loading true, clears error', () => {
    const prev = { ...initialState, error: 'previous error' };
    const action = loginUser.pending('req-id', { email: '', password: '' });
    const state = authReducer(prev, action);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('loginUser.fulfilled: sets authenticated, token, usuario', () => {
    const action = loginUser.fulfilled(mockPayload, 'req-id', { email: '', password: '' });
    const state = authReducer(initialState, action);
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('test-token-abc');
    expect(state.usuario).toEqual(mockUsuario);
    expect(state.loading).toBe(false);
  });

  it('loginUser.rejected: sets error, not authenticated', () => {
    const action = loginUser.rejected(
      new Error('Invalid credentials'),
      'req-id',
      { email: '', password: '' }
    );
    const state = authReducer(initialState, action);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Invalid credentials');
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
  });

  it('loginUser.rejected: uses fallback error message', () => {
    const action = { type: loginUser.rejected.type, error: {} };
    const state = authReducer(initialState, action);
    expect(state.error).toBe('Erro ao fazer login');
  });
});

describe('authSlice — restoreToken thunk', () => {
  it('restoreToken.fulfilled with null: stays unauthenticated', () => {
    const action = restoreToken.fulfilled(null, 'req-id');
    const state = authReducer(initialState, action);
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
  });

  it('restoreToken.fulfilled with payload: sets authenticated', () => {
    const action = restoreToken.fulfilled(mockPayload, 'req-id');
    const state = authReducer(initialState, action);
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('test-token-abc');
    expect(state.usuario).toEqual(mockUsuario);
  });
});

describe('authSlice — logout actions', () => {
  const loggedInState: AuthState = {
    isAuthenticated: true,
    token: 'abc',
    usuario: mockUsuario,
    loading: false,
    error: null,
  };

  it('logout sync action: resets all auth state', () => {
    const state = authReducer(loggedInState, logout());
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.usuario).toBeNull();
    expect(state.error).toBeNull();
  });

  it('logoutUser.fulfilled: resets auth state', () => {
    const action = logoutUser.fulfilled(undefined, 'req-id');
    const state = authReducer(loggedInState, action);
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.usuario).toBeNull();
  });

  it('clearError: removes error, preserves rest of state', () => {
    const prev = { ...loggedInState, error: 'some error' };
    const state = authReducer(prev, clearError());
    expect(state.error).toBeNull();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('abc');
  });
});

describe('authSlice — state immutability', () => {
  it('does not mutate previous state', () => {
    const prev = { ...initialState };
    authReducer(prev, loginUser.fulfilled(mockPayload, 'req-id', { email: '', password: '' }));
    expect(prev.isAuthenticated).toBe(false);
    expect(prev.token).toBeNull();
  });
});
