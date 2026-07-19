import { FileText } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

export default function AdminRelatoriosPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
          Relatórios
        </h1>
      </div>
      <div className={`rounded-xl border p-16 text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <FileText className={`h-12 w-12 mx-auto mb-3 ${isDark ? 'text-slate-700' : 'text-gray-300'}`} />
        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Relatórios em desenvolvimento
        </p>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
          Em breve disponível
        </p>
      </div>
    </div>
  );
}
