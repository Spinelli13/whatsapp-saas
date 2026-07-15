import { MOCK_CREDENTIALS, IS_MOCK_AUTH } from '../../config/mockAuth';

export function MockAuthWarning() {
  if (!IS_MOCK_AUTH) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-2">
        <span className="text-yellow-600 text-lg leading-none">⚠️</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-yellow-800">Modo Mock Ativo</p>
          <p className="text-xs text-yellow-700 mt-1 mb-2">
            Usando autenticação simulada. Não conecta ao backend real.
          </p>
          <div className="space-y-1">
            {MOCK_CREDENTIALS.map((u) => (
              <div key={u.email} className="text-xs text-yellow-700 font-mono bg-yellow-100 rounded px-2 py-1">
                <span className="font-medium">{u.email}</span>
                <span className="text-yellow-500"> / </span>
                <span>{u.senha}</span>
                <span className="ml-2 text-yellow-600">({u.role})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
