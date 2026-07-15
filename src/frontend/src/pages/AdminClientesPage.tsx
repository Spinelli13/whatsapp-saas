import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
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
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [planoId, setPlanoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/planos/disponibles')
      .then((r) => setPlanos(r.data))
      .catch(() => {});
  }, []);

  async function handleCriarCliente() {
    if (!nome || !email || !planoId) return;
    setLoading(true);
    setErro(null);
    setMensagem(null);
    try {
      // Endpoint /api/clientes não existe ainda — placeholder
      // const clienteRes = await apiClient.post('/clientes', { nome, email });
      // await apiClient.post(`/planos/cliente/${clienteRes.data.id}/plano/${planoId}`);
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
        <p className="text-red-600">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Super Admin — Gerenciar Clientes</h1>

      {erro && (
        <div className="p-3 rounded bg-red-100 text-red-700 text-sm" role="alert">
          {erro}
        </div>
      )}
      {mensagem && (
        <div className="p-3 rounded bg-green-100 text-green-700 text-sm">
          {mensagem}
        </div>
      )}

      <div className="rounded-lg border bg-white p-6 max-w-md">
        <h2 className="text-lg font-semibold mb-4">Criar Novo Cliente</h2>
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Plano</label>
            <select
              value={planoId}
              onChange={(e) => setPlanoId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
            fullWidth
            onClick={handleCriarCliente}
            loading={loading}
            disabled={!nome || !email || !planoId || loading}
          >
            Criar Cliente
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Clientes Ativos</h2>
        <p className="text-sm text-gray-500">
          Endpoint <code>/api/clientes</code> pendente de implementação.
        </p>
      </div>
    </div>
  );
}

export default AdminClientesPage;
