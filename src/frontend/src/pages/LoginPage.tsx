import { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MockAuthWarning } from '../components/common/MockAuthWarning';
import apiClient from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA verification state
  const [needs2FA, setNeeds2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [tipo2FA, setTipo2FA] = useState<'totp' | 'sms'>('totp');
  const [codigo2FA, setCodigo2FA] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // useAuth.login handles mock auth and real auth.
      // For real auth, check if the response signals 2FA is needed.
      await login(email, senha);
    } catch (err: unknown) {
      // If server returned tempToken (2FA required), the error won't be thrown
      // from mock auth. For real backend, the login hook would need updating.
      // Check via apiClient directly to detect 2FA requirement:
      try {
        const res = await apiClient.post('/auth/login', { email, senha });
        if (res.data.tempToken) {
          setTempToken(res.data.tempToken);
          setTipo2FA(res.data.tipo2FA);
          setNeeds2FA(true);
          return;
        }
      } catch {
        // fall through
      }
      setError('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  async function handle2FA(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-2fa', {
        tempToken,
        codigo: codigo2FA,
        deviceId: navigator.userAgent,
      });
      // Store the new tokens
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      window.location.href = '/dashboard';
    } catch {
      setError('Código inválido');
    } finally {
      setLoading(false);
    }
  }

  if (needs2FA) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="text-xl font-bold text-gray-900">Verificação 2FA</h1>
            <p className="text-sm text-gray-500 mt-1">
              {tipo2FA === 'totp' ? 'Digite o código do seu Authenticator' : 'Digite o código enviado por SMS'}
            </p>
          </div>

          <form onSubmit={handle2FA} className="flex flex-col gap-4">
            <Input
              label="Código de verificação"
              value={codigo2FA}
              onChange={(e) => setCodigo2FA(e.target.value)}
              placeholder="123456"
              maxLength={6}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500 text-center" role="alert">{error}</p>
            )}
            <Button type="submit" loading={loading} fullWidth>
              Verificar
            </Button>
            <button
              type="button"
              onClick={() => { setNeeds2FA(false); setCodigo2FA(''); setError(''); }}
              className="text-sm text-gray-500 underline text-center"
            >
              Voltar ao login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <MockAuthWarning />

        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">💬</div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp SaaS</h1>
            <p className="text-sm text-gray-500 mt-1">Painel de Atendimento</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
            />
            <Input
              label="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
            {error && (
              <p className="text-sm text-red-500 text-center" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} fullWidth className="mt-2">
              Entrar
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t space-y-2">
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <span>🔍</span> Entrar com Google
            </a>
            <a
              href="/api/auth/microsoft"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <span>🪟</span> Entrar com Microsoft
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
