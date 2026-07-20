import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import OportunidadeCard from './OportunidadeCard';

interface Oportunidade {
  id: string;
  titulo: string;
  valor: number;
  probabilidade: number;
  data_fechamento_esperada?: string;
  status: string;
  responsavel?: { nome: string };
}

interface Estagio {
  id: string;
  nome: string;
  cor: string;
  oportunidades: Oportunidade[];
  total: number;
  valor_total: number;
}

interface Props {
  estagios: Estagio[];
  onMover: (oportunidadeId: string, estagioId: string) => Promise<void>;
  onCardClick: (id: string) => void;
  onNovaOportunidade: (estagioId: string) => void;
}

function formatValor(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor || 0);
}

export default function PipelineBoard({ estagios, onMover, onCardClick, onNovaOportunidade }: Props) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDragStart(e: React.DragEvent, oportunidadeId: string) {
    setDraggingId(oportunidadeId);
    e.dataTransfer.setData('oportunidade_id', oportunidadeId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, estagioId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(estagioId);
  }

  async function handleDrop(e: React.DragEvent, estagioId: string) {
    e.preventDefault();
    const oportunidadeId = e.dataTransfer.getData('oportunidade_id');
    setDragOverId(null);
    setDraggingId(null);
    if (oportunidadeId) {
      await onMover(oportunidadeId, estagioId);
    }
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
      {estagios.map((estagio) => {
        const isOver = dragOverId === estagio.id;
        return (
          <div
            key={estagio.id}
            className={`flex-shrink-0 w-72 flex flex-col rounded-xl border transition-all ${
              isOver
                ? isDark ? 'border-cyan-500 bg-cyan-950/20' : 'border-cyan-400 bg-cyan-50'
                : isDark ? 'border-slate-700 bg-slate-900/50' : 'border-gray-200 bg-gray-50'
            }`}
            onDragOver={(e) => handleDragOver(e, estagio.id)}
            onDrop={(e) => handleDrop(e, estagio.id)}
            onDragLeave={handleDragLeave}
          >
            {/* Cabeçalho da coluna */}
            <div className="p-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: estagio.cor }} />
              <span className={`text-sm font-semibold flex-1 truncate ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                {estagio.nome}
              </span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-200 text-gray-600'
              }`}>
                {estagio.total}
              </span>
            </div>

            <div className={`px-3 pb-2 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {formatValor(estagio.valor_total)}
            </div>

            <div className={`h-px mx-3 mb-2 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />

            {/* Cards */}
            <div className="flex-1 px-2 space-y-2 overflow-y-auto min-h-[60px]">
              {estagio.oportunidades.map((op) => (
                <div
                  key={op.id}
                  className={`transition-opacity ${draggingId === op.id ? 'opacity-40' : 'opacity-100'}`}
                >
                  <OportunidadeCard
                    oportunidade={op}
                    onDragStart={handleDragStart}
                    onClick={onCardClick}
                  />
                </div>
              ))}

              {estagio.oportunidades.length === 0 && (
                <div className={`text-center text-xs py-4 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                  Sem oportunidades
                </div>
              )}
            </div>

            {/* Botão nova oportunidade */}
            <div className="p-2 pt-2">
              <button
                onClick={() => onNovaOportunidade(estagio.id)}
                className={`w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isDark
                    ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                Nova oportunidade
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
