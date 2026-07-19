import { AlertTriangle } from 'lucide-react';
import { MOCK_CREDENTIALS, IS_MOCK_AUTH } from '../../config/mockAuth';

export function MockAuthWarning() {
  if (!IS_MOCK_AUTH) return null;

  return (
    <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 mb-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-300">Modo Mock Ativo</p>
          <p className="text-xs text-amber-400/80 mt-1 mb-2">
            Usando autenticação simulada. Não conecta ao backend real.
          </p>
          <div className="space-y-1">
            {MOCK_CREDENTIALS.map((u) => (
              <div
                key={u.email}
                className="text-xs text-amber-300/80 font-mono bg-amber-950/40 border border-amber-800/30 rounded-lg px-2.5 py-1.5"
              >
                <span className="font-medium text-amber-200">{u.email}</span>
                <span className="text-amber-600 mx-1">/</span>
                <span>{u.senha}</span>
                <span className="ml-2 text-amber-500">({u.role})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
