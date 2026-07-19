import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function NovoClientePage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [form, setForm] = useState({ nome: '', email: '', plano: 'basico' });
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      setMensagem(`Cliente "${form.nome}" será criado (endpoint /api/clientes pendente).`);
      setForm({ nome: '', email: '', plano: 'basico' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-7">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Adicionar Novo Cliente
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            Preencha os dados para criar o cliente
          </p>
        </div>
      </div>

      {mensagem && (
        <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {mensagem}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`rounded-xl border p-6 space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}
      >
        <Input
          label="Nome da Empresa"
          value={form.nome}
          onChange={(e) => set('nome', e.target.value)}
          placeholder="Empresa LTDA"
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="contato@empresa.com"
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            Plano
          </label>
          <select
            value={form.plano}
            onChange={(e) => set('plano', e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-100'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="basico">Básico</option>
            <option value="profissional">Profissional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" icon={Plus} loading={loading}>
            Criar Cliente
          </Button>
          <Link
            to="/admin/clientes"
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              isDark
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                : 'border-gray-300 hover:bg-gray-100 text-gray-700'
            }`}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
