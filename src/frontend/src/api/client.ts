import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Token is stored inside the Zustand persist blob, not as a standalone key.
// Reading it from the right place avoids circular dep (authStore → auth.ts → client.ts).
const PERSIST_KEY = 'whatsapp-saas-auth';

function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { state?: { token?: string } })?.state?.token ?? null;
  } catch {
    return null;
  }
}

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = getStoredToken();
      if (!token) {
        // Truly unauthenticated (no token at all) → redirect to login
        window.location.href = '/login';
      }
      // Has a token but got 401: permission error or mock/expired token.
      // Let the calling component handle the error with its own UI.
      // Avoids spurious logouts in dev/mock mode.
    }
    return Promise.reject(error);
  }
);

export default apiClient;
