import { Check, Brain, AlertTriangle, Clock, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Recomendacao {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'proximo_passo' | 'risco_perda' | 'melhor_momento' | 'personalizacao';
  prioridade: 'baixa' | 'media' | 'alta';
  acao_sugerida: string | null;
}

interface RecomendacoesWidgetProps {
  recomendacoes: Recomendacao[];
  onRefresh: () => void;
  isDark: boolean;
}

const tipoIcon: Record<string, React.ElementType> = {
  proximo_passo: Brain,
  risco_perda: AlertTriangle,
  melhor_momento: Clock,
  personalizacao: User,
};

const prioridadeColor: Record<string, string> = {
  alta: 'border-l-red-500',
  media: 'border-l-yellow-500',
  baixa: 'border-l-blue-400',
};

export default function RecomendacoesWidget({ recomendacoes, onRefresh, isDark }: RecomendacoesWidgetProps) {
  const { token } = useAuthStore();

  const marcarVisualizado = async (id: string) => {
    try {
      await fetch(`/api/analytics/ia/recomendacoes/${id}/visualizado`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } catch {
      // silent
    }
  };

  if (recomendacoes.length === 0) {
    return (
      <div className={`py-16 rounded-lg border text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <Brain className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Sem recomendações pendentes</p>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
          A IA irá gerar insights à medida que você usa o sistema
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recomendacoes.map((rec) => {
        const Icon = tipoIcon[rec.tipo] ?? Brain;
        return (
          <div
            key={rec.id}
            className={`p-4 rounded-lg border border-l-4 ${prioridadeColor[rec.prioridade]} ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <Icon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{rec.titulo}</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{rec.descricao}</p>
                {rec.acao_sugerida && (
                  <p className={`text-xs mt-2 font-medium ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    → {rec.acao_sugerida}
                  </p>
                )}
              </div>
              <button
                onClick={() => marcarVisualizado(rec.id)}
                title="Marcar como visto"
                className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                  isDark ? 'hover:bg-slate-700 text-slate-500 hover:text-green-400' : 'hover:bg-gray-100 text-gray-400 hover:text-green-500'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
