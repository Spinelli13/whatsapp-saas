import { Zap } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import WorkflowCard from './WorkflowCard';

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

interface WorkflowListProps {
  workflows: Workflow[];
  onRefresh: () => void;
}

export default function WorkflowList({ workflows, onRefresh }: WorkflowListProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  if (workflows.length === 0) {
    return (
      <div className={`py-16 rounded-lg border text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <Zap className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Nenhum workflow criado ainda
        </p>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
          Crie seu primeiro workflow clicando em "Novo Workflow"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          isDark={isDark}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
