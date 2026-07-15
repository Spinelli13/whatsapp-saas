import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';
import { Button } from '../components/ui/Button';

interface Plano {
  id: number;
  nome: string;
  descricao: string;
  preco_mensal: number;
  usuarios_limite: number;
  mensagens_limite: number;
  departamentos_limite: number;
  features: string[];
}

interface Limites {
  mensagens: { usado: number; limite: number; atingiu: boolean };
  usuarios: { usado: number; limite: number; atingiu: boolean };
  departamentos: { usado: number; limite: number; atingiu: boolean };
}

interface PlanoAtual {
  id: number;
  plano_id: number;
  status: string;
  Plano: Plano;
}

function ProgressBar({ usado, limite, atingiu }: { usado: number; limite: number; atingiu: boolean }) {
  const pct = limite > 0 ? Math.min((usado / limite) * 100, 100) : 0;
  return (
    <div className="mt-2 h-2 rounded bg-gray-200">
      <div
        className={`h-2 rounded transition-all ${atingiu ? 'bg-red-500' : 'bg-green-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function PlanosPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [planoAtual, setPlanoAtual] = useState<PlanoAtual | null>(null);
  const [limites, setLimites] = useState<Limites | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [dispRes, planoRes, usoRes] = await Promise.allSettled([
          apiClient.get('/planos/disponibles'),
          apiClient.get('/planos/meu-plano'),
          apiClient.get('/planos/meu-uso'),
        ]);
        if (dispRes.status === 'fulfilled') setPlanos(dispRes.value.data);
        if (planoRes.status === 'fulfilled') setPlanoAtual(planoRes.value.data);
        if (usoRes.status === 'fulfilled') setLimites(usoRes.value.data.limites);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Carregando planos...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Seus Planos</h1>

      {/* Plano Atual */}
      {planoAtual && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-2 text-lg font-semibold">Plano Atual</h2>
          <p className="text-xl font-bold uppercase text-blue-700">
            {planoAtual.Plano.nome}
            <span className="ml-2 text-base font-normal text-gray-600">
              — R$ {Number(planoAtual.Plano.preco_mensal).toFixed(2)}/mês
            </span>
          </p>
          <p className="mt-1 text-sm text-gray-600">{planoAtual.Plano.descricao}</p>
        </div>
      )}

      {/* Uso Atual */}
      {limites && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Uso do Mês Atual</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(
              [
                { label: 'Mensagens', key: 'mensagens' },
                { label: 'Usuários', key: 'usuarios' },
                { label: 'Departamentos', key: 'departamentos' },
              ] as const
            ).map(({ label, key }) => {
              const d = limites[key];
              return (
                <div key={key} className="rounded-lg border bg-white p-4 text-center shadow-sm">
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold">
                    {d.usado}
                    <span className="text-base font-normal text-gray-400">/{d.limite.toLocaleString()}</span>
                  </p>
                  <ProgressBar usado={d.usado} limite={d.limite} atingiu={d.atingiu} />
                  {d.atingiu && (
                    <p className="mt-1 text-xs font-medium text-red-600">Limite atingido</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparação de Planos */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Outros Planos Disponíveis</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {planos.map((plano) => {
            const isAtual = planoAtual?.plano_id === plano.id;
            return (
              <div
                key={plano.id}
                className={`rounded-lg border-2 p-5 ${
                  isAtual ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <h3 className="text-lg font-bold capitalize">{plano.nome}</h3>
                <p className="mt-1 text-sm text-gray-500">{plano.descricao}</p>
                <p className="mt-3 text-3xl font-bold text-blue-600">
                  R$ {Number(plano.preco_mensal).toFixed(2)}
                  <span className="text-sm font-normal text-gray-500">/mês</span>
                </p>
                <ul className="mt-4 space-y-1 text-sm text-gray-700">
                  <li>👤 Até {plano.usuarios_limite.toLocaleString()} usuários</li>
                  <li>💬 {plano.mensagens_limite.toLocaleString()} mensagens/mês</li>
                  <li>🏢 {plano.departamentos_limite.toLocaleString()} departamentos</li>
                </ul>
                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                  {plano.features.map((f) => (
                    <li key={f}>✅ {f}</li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Button size="sm" fullWidth disabled>
                    {isAtual ? 'Plano Atual' : 'Contrate'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PlanosPage;
