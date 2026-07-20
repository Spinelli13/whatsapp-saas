import { Calendar, AlertCircle } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  status: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  data_vencimento?: string;
  usuarioAtribuido?: { nome: string };
}

interface Props {
  tarefa: Tarefa;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

const PRIORIDADE_COR: Record<string, string> = {
  baixa: 'bg-blue-500',
  media: 'bg-yellow-500',
  alta: 'bg-orange-500',
  critica: 'bg-red-500',
};

export default function TarefaCard({ tarefa, onDragStart }: Props) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const vencida =
    tarefa.data_vencimento &&
    new Date(tarefa.data_vencimento) < new Date() &&
    tarefa.status !== 'concluida';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, tarefa.id)}
      className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDark
          ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-2">
        <p className={`text-sm font-medium flex-1 line-clamp-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
          {tarefa.titulo}
        </p>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${PRIORIDADE_COR[tarefa.prioridade]}`} />
      </div>

      {tarefa.descricao && (
        <p className={`text-xs mt-1.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          {tarefa.descricao}
        </p>
      )}

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {vencida && <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
        {tarefa.data_vencimento && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-cyan-400" />
            <span className={`text-xs ${vencida ? 'text-red-400' : isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
        {tarefa.usuarioAtribuido && (
          <span className={`text-xs ml-auto ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            {tarefa.usuarioAtribuido.nome}
          </span>
        )}
      </div>
    </div>
  );
}
