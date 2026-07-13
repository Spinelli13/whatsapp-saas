import { useState, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, senha);
    } catch {
      setError('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
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
          <Button type="submit" loading={loading} className="w-full mt-2">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
