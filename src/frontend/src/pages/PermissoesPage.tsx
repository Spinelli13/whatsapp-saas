import { useEffect, useState } from 'react';
import { Shield, Plus, Check, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import apiClient from '../api/client';
import { Button } from '../components/ui/Button';

interface Permissao {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
}

interface Role {
  id: number;
  nome: string;
  descricao: string | null;
  eh_customizado: boolean;
  Permissaos: Permissao[];
}

interface PermissoesPorCategoria {
  [categoria: string]: Permissao[];
}

export function PermissoesPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissoesPorCategoria, setPermissoesPorCategoria] = useState<PermissoesPorCategoria>({});
  const [roleSelecionada, setRoleSelecionada] = useState<Role | null>(null);
  const [novoRoleNome, setNovoRoleNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        apiClient.get('/roles'),
        apiClient.get('/roles/permissoes/listar'),
      ]);
      setRoles(rolesRes.data.roles);
      setPermissoesPorCategoria(permsRes.data.por_categoria);
    } catch {
      setErro('Erro ao carregar dados de permissões');
    } finally {
      setLoading(false);
    }
  }

  async function criarRole() {
    if (!novoRoleNome.trim()) return;
    try {
      await apiClient.post('/roles', { nome: novoRoleNome.trim(), eh_customizado: true });
      setNovoRoleNome('');
      setMensagem('Role criada com sucesso');
      await carregarDados();
    } catch {
      setErro('Erro ao criar role');
    }
  }

  async function togglePermissao(roleId: number, permissaoId: number, temPermissao: boolean) {
    try {
      if (temPermissao) {
        await apiClient.delete(`/roles/${roleId}/permissoes/${permissaoId}`);
      } else {
        await apiClient.post(`/roles/${roleId}/permissoes/${permissaoId}`);
      }
      setMensagem(temPermissao ? 'Permissão removida' : 'Permissão adicionada');
      const res = await apiClient.get(`/roles/${roleId}`);
      const updated = res.data.role as Role;
      setRoleSelecionada(updated);
      setRoles((prev) => prev.map((r) => (r.id === roleId ? updated : r)));
    } catch {
      setErro('Erro ao atualizar permissão');
    }
  }

  if (!usuario || usuario.role !== 'admin') {
    return (
      <div className="p-6">
        <p className="text-red-400">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-7">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Gerenciar Roles e Permissões
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
            Controle de acesso granular por role
          </p>
        </div>
      </div>

      {erro && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {erro}
          <button className="ml-auto" onClick={() => setErro(null)}><X className="h-4 w-4" /></button>
        </div>
      )}
      {mensagem && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {mensagem}
          <button className="ml-auto" onClick={() => setMensagem(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <h2 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            Roles
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Nova role..."
              value={novoRoleNome}
              onChange={(e) => setNovoRoleNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && criarRole()}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
            <Button size="sm" icon={Plus} onClick={criarRole}>Criar</Button>
          </div>

          {loading ? (
            <p className={`text-sm ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>Carregando...</p>
          ) : (
            <ul className="space-y-1.5">
              {roles.map((role) => (
                <li key={role.id}>
                  <button
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                      roleSelecionada?.id === role.id
                        ? isDark
                          ? 'bg-cyan-600/20 border-cyan-600/40 text-cyan-300'
                          : 'bg-cyan-50 border-cyan-300 text-cyan-700'
                        : isDark
                          ? 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => setRoleSelecionada(role)}
                  >
                    <span className="font-medium text-sm">{role.nome}</span>
                    {role.eh_customizado && (
                      <span className={`ml-2 text-xs opacity-60`}>(custom)</span>
                    )}
                    <span className={`block text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {role.Permissaos?.length ?? 0} permissões
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="col-span-2">
          {roleSelecionada ? (
            <>
              <h2 className={`text-xs font-semibold uppercase tracking-wide mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Permissões — <span className={`normal-case ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{roleSelecionada.nome}</span>
              </h2>
              {Object.entries(permissoesPorCategoria).map(([categoria, perms]) => (
                <div key={categoria} className="mb-5">
                  <h3 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                    {categoria}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((perm) => {
                      const temPermissao = roleSelecionada.Permissaos?.some((p) => p.id === perm.id) ?? false;
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-2.5 p-2.5 border rounded-lg cursor-pointer transition-all duration-200 ${
                            temPermissao
                              ? isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
                              : isDark ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                            temPermissao ? 'bg-cyan-500 border-cyan-500' : isDark ? 'border-slate-600 bg-slate-700' : 'border-gray-300 bg-white'
                          }`}>
                            {temPermissao && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={temPermissao}
                            onChange={() => togglePermissao(roleSelecionada.id, perm.id, temPermissao)}
                            className="sr-only"
                          />
                          <div>
                            <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{perm.nome}</span>
                            <span className={`block text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{perm.descricao}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className={`flex flex-col items-center justify-center h-40 gap-2 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
              <Shield className="h-8 w-8 opacity-30" />
              <p className="text-sm">Selecione uma role para editar suas permissões</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PermissoesPage;
