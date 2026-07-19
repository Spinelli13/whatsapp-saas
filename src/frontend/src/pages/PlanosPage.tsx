import { useEffect, useState } from 'react';
import { CreditCard, Users, MessageCircle, Building2, Check, TrendingUp, Zap } from 'lucide-react';
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
    <div className="mt-2 h-1.5 rounded-full bg-slate-700">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${atingiu ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const PLANO_ICONS = [TrendingUp, Zap, CreditCard];

export function PlanosPage() {
  const _usuario = useAuthStore((s) => s.usuario);
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
    return <div className="p-6 text-slate-500">Carregando planos...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Seus Planos</h1>
          <p className="text-sm text-slate-500">Gerencie sua assinatura e limites</p>
        </div>
      </div>

      {/* Plano Atual */}
      {planoAtual && (
        <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-600/10 to-blue-700/10 p-6">
          <p className="text-xs font-semibold text-cyan-500 uppercase tracking-widest mb-1">Plano Ativo</p>
          <p className="text-2xl font-bold uppercase text-slate-100">
            {planoAtual.Plano.nome}
            <span className="ml-2 text-base font-normal text-slate-400">
              — R$ {Number(planoAtual.Plano.preco_mensal).toFixed(2)}/mês
            </span>
          </p>
          <p className="mt-1 text-sm text-slate-400">{planoAtual.Plano.descricao}</p>
        </div>
      )}

      {/* Uso Atual */}
      {limites && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Uso do Mês Atual</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(
              [
                { label: 'Mensagens', key: 'mensagens', Icon: MessageCircle },
                { label: 'Usuários', key: 'usuarios', Icon: Users },
                { label: 'Departamentos', key: 'departamentos', Icon: Building2 },
              ] as const
            ).map(({ label, key, Icon }) => {
              const d = limites[key];
              return (
                <div key={key} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-slate-400" />
                    <p className="text-sm text-slate-400">{label}</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">
                    {d.usado}
                    <span className="text-base font-normal text-slate-500">/{d.limite.toLocaleString()}</span>
                  </p>
                  <ProgressBar usado={d.usado} limite={d.limite} atingiu={d.atingiu} />
                  {d.atingiu && (
                    <p className="mt-1.5 text-xs font-medium text-red-400">Limite atingido</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparação de Planos */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Outros Planos Disponíveis</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {planos.map((plano, idx) => {
            const isAtual = planoAtual?.plano_id === plano.id;
            const Icon = PLANO_ICONS[idx % PLANO_ICONS.length];
            return (
              <div
                key={plano.id}
                className={`rounded-xl border-2 p-5 transition-all duration-300 ${
                  isAtual
                    ? 'border-cyan-500/60 bg-gradient-to-br from-cyan-600/15 to-blue-700/10 shadow-lg shadow-cyan-900/20'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <Icon className={`h-5 w-5 ${isAtual ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <h3 className="text-lg font-bold capitalize text-slate-100">{plano.nome}</h3>
                  {isAtual && (
                    <span className="ml-auto text-xs text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">Atual</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-3">{plano.descricao}</p>
                <p className="text-3xl font-bold text-slate-100 mb-4">
                  R$ {Number(plano.preco_mensal).toFixed(2)}
                  <span className="text-sm font-normal text-slate-500">/mês</span>
                </p>
                <ul className="space-y-1.5 text-sm text-slate-400 mb-4">
                  <li className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    Até {plano.usuarios_limite.toLocaleString()} usuários
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 text-slate-500" />
                    {plano.mensagens_limite.toLocaleString()} mensagens/mês
                  </li>
                  <li className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    {plano.departamentos_limite.toLocaleString()} departamentos
                  </li>
                </ul>
                <ul className="space-y-1.5 text-sm text-slate-400 mb-5">
                  {plano.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button size="sm" fullWidth disabled>
                  {isAtual ? 'Plano Atual' : 'Contrate'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PlanosPage;
