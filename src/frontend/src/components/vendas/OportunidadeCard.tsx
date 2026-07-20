import { useThemeStore } from '../../store/themeStore';

interface Oportunidade {
  id: string;
  titulo: string;
  valor: number;
  probabilidade: number;
  data_fechamento_esperada?: string;
  status: string;
  responsavel?: { nome: string };
}

interface Props {
  oportunidade: Oportunidade;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: (id: string) => void;
}

function formatValor(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

function formatData(data?: string) {
  if (!data) return null;
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function OportunidadeCard({ oportunidade, onDragStart, onClick }: Props) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const prob = oportunidade.probabilidade ?? 50;

  const probColor = prob >= 70 ? 'bg-green-500' : prob >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, oportunidade.id)}
      onClick={() => onClick(oportunidade.id)}
      className={`rounded-lg p-3 cursor-grab active:cursor-grabbing border transition-all hover:shadow-md ${
        isDark
          ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className={`text-sm font-medium mb-2 line-clamp-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
        {oportunidade.titulo}
      </p>

      <p className={`text-base font-semibold mb-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
        {formatValor(oportunidade.valor)}
      </p>

      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Prob.</span>
          <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{prob}%</span>
        </div>
        <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
          <div className={`h-full rounded-full ${probColor}`} style={{ width: `${prob}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        {oportunidade.responsavel && (
          <span className={`text-xs truncate max-w-[100px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {oportunidade.responsavel.nome}
          </span>
        )}
        {oportunidade.data_fechamento_esperada && (
          <span className={`text-xs ml-auto ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            {formatData(oportunidade.data_fechamento_esperada)}
          </span>
        )}
      </div>
    </div>
  );
}
