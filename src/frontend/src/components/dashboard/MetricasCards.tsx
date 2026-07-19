import { Ticket, MessageCircle, CheckCircle2, Star } from 'lucide-react';

interface Metrica {
  label: string;
  valor: number | string;
  Icon: React.ElementType;
  gradient: string;
  iconColor: string;
}

const METRICAS: Metrica[] = [
  {
    label: 'Tickets Hoje',
    valor: 24,
    Icon: Ticket,
    gradient: 'from-blue-600/15 to-blue-800/10',
    iconColor: 'text-blue-400',
  },
  {
    label: 'Em Atendimento',
    valor: 7,
    Icon: MessageCircle,
    gradient: 'from-cyan-600/15 to-cyan-800/10',
    iconColor: 'text-cyan-400',
  },
  {
    label: 'Resolvidos',
    valor: 17,
    Icon: CheckCircle2,
    gradient: 'from-emerald-600/15 to-emerald-800/10',
    iconColor: 'text-emerald-400',
  },
  {
    label: 'Satisfação Média',
    valor: '4.8',
    Icon: Star,
    gradient: 'from-amber-600/15 to-amber-800/10',
    iconColor: 'text-amber-400',
  },
];

export function MetricasCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {METRICAS.map((m) => (
        <div
          key={m.label}
          className={`bg-gradient-to-br ${m.gradient} rounded-xl border border-slate-800 p-5
            hover:border-slate-700 hover:shadow-lg transition-all duration-300 animate-fade-in`}
        >
          <div className="flex items-start justify-between mb-3">
            <m.Icon className={`h-6 w-6 ${m.iconColor}`} />
          </div>
          <p className="text-2xl font-bold text-slate-100">{m.valor}</p>
          <p className="text-xs text-slate-400 mt-1">{m.label}</p>
        </div>
      ))}
    </div>
  );
}
