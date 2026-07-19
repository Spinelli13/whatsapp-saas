import { ReactNode } from 'react';
import { Sun, Moon, MessageSquare } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../../hooks/useAuth';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { theme, toggleTheme } = useThemeStore();
  const { usuario } = useAuth();
  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className={`h-14 flex items-center justify-between px-5 border-b flex-shrink-0 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              WhatsApp SaaS
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${
              isDark ? 'bg-slate-800 text-cyan-400 border-slate-700' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
            }`}>
              {usuario?.role}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm hidden sm:inline ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {usuario?.email}
            </span>
            <button
              onClick={toggleTheme}
              title={`Mudar para modo ${isDark ? 'claro' : 'escuro'}`}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className={`flex-1 overflow-auto ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
