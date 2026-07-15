interface Metrica {
  label: string;
  valor: number | string;
  icon: string;
  cor: string;
}

const METRICAS_MOCK: Metrica[] = [
  { label: 'Tickets Hoje', valor: 24, icon: '🎫', cor: 'bg-blue-50 text-blue-700' },
  { label: 'Em Atendimento', valor: 7, icon: '💬', cor: 'bg-green-50 text-green-700' },
  { label: 'Resolvidos', valor: 17, icon: '✅', cor: 'bg-gray-50 text-gray-700' },
  { label: 'Satisfação Média', valor: '4.8 ⭐', icon: '📊', cor: 'bg-yellow-50 text-yellow-700' },
];

export function MetricasCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {METRICAS_MOCK.map((m) => (
        <div
          key={m.label}
          className={`rounded-xl p-4 shadow-sm border border-gray-100 ${m.cor}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{m.icon}</span>
          </div>
          <p className="text-2xl font-bold">{m.valor}</p>
          <p className="text-sm mt-1 opacity-80">{m.label}</p>
        </div>
      ))}
    </div>
  );
}
