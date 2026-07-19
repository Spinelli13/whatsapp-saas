import { useState, useEffect } from 'react';
import { Users, Plus, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import apiClient from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface Plano {
  id: number;
  nome: string;
  preco_mensal: number;
}

export function AdminClientesPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [planoId, setPlanoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/planos/disponibles').then((r) => setPlanos(r.data)).catch(() => {});
  }, []);

  async function handleCriarCliente() {
    if (!nome || !email || !planoId) return;
    setLoading(true);
    setErro(null);
    setMensagem(null);
    try {
      setMensagem(`Cliente "${nome}" será criado com o plano selecionado (endpoint /api/clientes pendente).`);
      setNome('');
      setEmail('');
      setPlanoId('');
    } catch {
      setErro('Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  }

  if (!usuario || usuario.role !== 'admin') {
    return (
      <div className="p-6">
        <p className="text-red-400">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Super Admin — Gerenciar Clientes
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            Crie e gerencie clientes da plataforma
          </p>
        </div>
      </div>

      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {erro}
          <button className="ml-auto" onClick={() => setErro(null)}><X className="h-4 w-4" /></button>
        </div>
      )}
      {mensagem && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {mensagem}
          <button className="ml-auto" onClick={() => setMensagem(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className={`rounded-xl border p-6 max-w-md ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
          Criar Novo Cliente
        </h2>
        <div className="space-y-4">
          <Input
            label="Nome da Empresa"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Empresa LTDA"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contato@empresa.com"
          />
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Plano
            </label>
            <select
              value={planoId}
              onChange={(e) => setPlanoId(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Selecionar plano...</option>
              {planos.map((plano) => (
                <option key={plano.id} value={plano.id}>
                  {plano.nome.toUpperCase()} — R$ {Number(plano.preco_mensal).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <Button
            icon={Plus}
            fullWidth
            onClick={handleCriarCliente}
            loading={loading}
            disabled={!nome || !email || !planoId || loading}
          >
            Criar Cliente
          </Button>
        </div>
      </div>

      <div className={`rounded-xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <h2 className={`text-lg font-semibold mb-3 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
          Clientes Ativos
        </h2>
        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
          Endpoint <code className={`px-1 py-0.5 rounded text-xs ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700'}`}>/api/clientes</code> pendente de implementação.
        </p>
      </div>
    </div>
  );
}

export default AdminClientesPage;
