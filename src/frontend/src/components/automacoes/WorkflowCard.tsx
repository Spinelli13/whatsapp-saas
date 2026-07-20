import { useState } from 'react';
import { GitBranch, Play, Pause, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Workflow {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  status: 'ativo' | 'inativo' | 'pausado';
  triggers: unknown[];
  acoes: unknown[];
  execucoes_count: number;
}

interface WorkflowCardProps {
  workflow: Workflow;
  isDark: boolean;
  onRefresh: () => void;
}

const statusDot: Record<string, string> = {
  ativo: 'bg-green-500',
  inativo: 'bg-gray-400',
  pausado: 'bg-yellow-500',
};

const tipoLabel: Record<string, string> = {
  trigger_evento: 'Evento',
  trigger_manual: 'Manual',
  agendado: 'Agendado',
};

export default function WorkflowCard({ workflow, isDark, onRefresh }: WorkflowCardProps) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const toggleStatus = async () => {
    const novoStatus = workflow.status === 'ativo' ? 'pausado' : 'ativo';
    setLoading(true);
    try {
      await fetch(`/api/automacoes/workflows/${workflow.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });
      onRefresh();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const deletar = async () => {
    if (!confirm(`Deletar workflow "${workflow.nome}"?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/automacoes/workflows/${workflow.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all hover:shadow-md ${
        isDark
          ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status indicator + icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${statusDot[workflow.status]}`}>
          <GitBranch className="w-4 h-4 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {workflow.nome}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
              {tipoLabel[workflow.tipo] ?? workflow.tipo}
            </span>
          </div>
          {workflow.descricao && (
            <p className={`text-sm mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {workflow.descricao}
            </p>
          )}
          <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            {workflow.triggers?.length ?? 0} trigger{workflow.triggers?.length !== 1 ? 's' : ''}{' '}
            · {workflow.acoes?.length ?? 0} ação{workflow.acoes?.length !== 1 ? 'ões' : ''}
            {workflow.execucoes_count > 0 && ` · ${workflow.execucoes_count} execuções`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={toggleStatus}
            disabled={loading}
            title={workflow.status === 'ativo' ? 'Pausar' : 'Ativar'}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
          >
            {workflow.status === 'ativo' ? (
              <Pause className="w-4 h-4 text-cyan-400" />
            ) : (
              <Play className="w-4 h-4 text-cyan-400" />
            )}
          </button>
          <button
            onClick={deletar}
            disabled={loading}
            title="Deletar"
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${isDark ? 'hover:bg-slate-700 text-slate-500 hover:text-red-400' : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
