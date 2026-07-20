import { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import TarefaCard from './TarefaCard';

interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  status: 'todo' | 'em_progresso' | 'concluida';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  data_vencimento?: string;
  usuarioAtribuido?: { nome: string };
}

interface Props {
  tarefas: Tarefa[];
  onRefresh: () => void;
}

const COLUNAS: { key: Tarefa['status']; label: string }[] = [
  { key: 'todo',        label: 'A Fazer' },
  { key: 'em_progresso', label: 'Em Progresso' },
  { key: 'concluida',  label: 'Concluída' },
];

const COLUNA_COR: Record<string, string> = {
  todo:         '#6B7280',
  em_progresso: '#F59E0B',
  concluida:    '#10B981',
};

export default function TarefasBoard({ tarefas, onRefresh }: Props) {
  const { theme } = useThemeStore();
  const token = useAuthStore((s) => s.token);
  const isDark = theme === 'dark';

  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDragStart(e: React.DragEvent, tarefaId: string) {
    setDraggingId(tarefaId);
    e.dataTransfer.setData('tarefa_id', tarefaId);
    e.dataTransfer.effectAllowed = 'move';
  }

  async function handleDrop(e: React.DragEvent, novoStatus: string) {
    e.preventDefault();
    const tarefaId = e.dataTransfer.getData('tarefa_id');
    setDragOverCol(null);
    setDraggingId(null);
    if (!tarefaId) return;

    await fetch(`/api/tarefas/${tarefaId}/status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
    });
    onRefresh();
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {COLUNAS.map(({ key, label }) => {
        const col = tarefas.filter((t) => t.status === key);
        const isOver = dragOverCol === key;

        return (
          <div
            key={key}
            className={`flex-shrink-0 w-72 flex flex-col rounded-xl border transition-all ${
              isOver
                ? isDark ? 'border-cyan-500 bg-cyan-950/20' : 'border-cyan-400 bg-cyan-50'
                : isDark ? 'border-slate-700 bg-slate-900/50' : 'border-gray-200 bg-gray-50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(key); }}
            onDrop={(e) => handleDrop(e, key)}
            onDragLeave={() => setDragOverCol(null)}
          >
            <div className="p-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLUNA_COR[key] }} />
              <span className={`text-sm font-semibold flex-1 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                {label}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-200 text-gray-600'
              }`}>
                {col.length}
              </span>
            </div>

            <div className={`h-px mx-3 mb-2 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />

            <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto min-h-[60px]">
              {col.map((t) => (
                <div key={t.id} className={draggingId === t.id ? 'opacity-40' : ''}>
                  <TarefaCard tarefa={t} onDragStart={handleDragStart} />
                </div>
              ))}
              {col.length === 0 && (
                <p className={`text-center text-xs py-6 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                  Sem tarefas
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
