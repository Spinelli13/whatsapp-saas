import { MessageCircle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

const STATS = [
  { label: 'Mensagens Recebidas', value: '342', Icon: MessageCircle, color: 'text-cyan-400' },
  { label: 'Aguardando', value: '5', Icon: Clock, color: 'text-amber-400' },
  { label: 'Respondidas', value: '337', Icon: CheckCircle2, color: 'text-emerald-400' },
  { label: 'Não Respondidas', value: '3', Icon: AlertCircle, color: 'text-red-400' },
];

const FILA = [
  { id: 1, contato: '+55 11 99999-9999', mensagem: 'Olá, preciso de ajuda', tempo: '5 min atrás', status: 'novo' },
  { id: 2, contato: 'João Silva', mensagem: 'Já resolveu meu problema?', tempo: '15 min atrás', status: 'respondido' },
  { id: 3, contato: 'Maria Santos', mensagem: 'Qual o preço do serviço?', tempo: '1 hora atrás', status: 'novo' },
];

export default function ClientDashboard() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
          Seu Dashboard
        </h2>
        <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
          Resumo das suas conversas
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${
              isDark
                ? 'bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border-slate-800'
                : 'bg-gradient-to-br from-cyan-50 to-blue-50 border-gray-200 shadow-sm'
            }`}
          >
            <s.Icon className={`h-5 w-5 mb-2 ${s.color}`} />
            <p className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              {s.value}
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
          <h3 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Fila Recente
          </h3>
        </div>
        <div className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-100'}`}>
          {FILA.map((item) => (
            <div
              key={item.id}
              className={`px-6 py-4 transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
                    {item.contato}
                  </p>
                  <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    {item.mensagem}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                    {item.tempo}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.status === 'novo'
                      ? 'bg-cyan-600/20 text-cyan-400'
                      : 'bg-emerald-600/20 text-emerald-400'
                  }`}>
                    {item.status === 'novo' ? 'Novo' : 'Respondido'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
