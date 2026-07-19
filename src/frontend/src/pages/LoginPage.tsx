import { useState, FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, Shield, Chrome, AlertCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MockAuthWarning } from '../components/common/MockAuthWarning';
import apiClient from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [needs2FA, setNeeds2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [tipo2FA, setTipo2FA] = useState<'totp' | 'sms'>('totp');
  const [codigo2FA, setCodigo2FA] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, senha);
    } catch {
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl shadow-black/50 p-8">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-900/30">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-100">Verificação 2FA</h1>
              <p className="text-sm text-slate-400 mt-1">
                {tipo2FA === 'totp' ? 'Código do Authenticator' : 'Código enviado por SMS'}
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
                className="text-center tracking-widest text-lg"
              />
              {error && (
                <p className="flex items-center justify-center gap-1.5 text-sm text-red-400" role="alert">
                  <AlertCircle className="h-4 w-4" /> {error}
                </p>
              )}
              <Button type="submit" loading={loading} fullWidth>Verificar</Button>
              <button
                type="button"
                onClick={() => { setNeeds2FA(false); setCodigo2FA(''); setError(''); }}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors text-center"
              >
                ← Voltar ao login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <MockAuthWarning />

        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl shadow-black/50 p-8">
          <div className="text-center mb-7">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-900/30">
              <MessageSquare className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">WhatsApp SaaS</h1>
            <p className="text-sm text-slate-500 mt-1">Painel de Atendimento</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-10 py-2 text-sm text-slate-100 placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-sm text-red-400 justify-center" role="alert">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}

            <Button type="submit" loading={loading} fullWidth className="mt-1">
              Entrar
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 border border-slate-700 rounded-lg
                text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-600 transition-all duration-200"
            >
              <Chrome className="h-4 w-4" /> Entrar com Google
            </a>
            <a
              href="/api/auth/microsoft"
              className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 border border-slate-700 rounded-lg
                text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-600 transition-all duration-200"
            >
              <Shield className="h-4 w-4" /> Entrar com Microsoft
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
