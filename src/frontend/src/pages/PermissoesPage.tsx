import { useEffect, useState } from 'react';
import { Shield, Plus, Check, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissoesPorCategoria, setPermissoesPorCategoria] = useState<PermissoesPorCategoria>({});
  const [roleSelecionada, setRoleSelecionada] = useState<Role | null>(null);
  const [novoRoleNome, setNovoRoleNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

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
          <h1 className="text-2xl font-bold text-slate-100">Gerenciar Roles e Permissões</h1>
          <p className="text-sm text-slate-500">Controle de acesso granular por role</p>
        </div>
      </div>

      {erro && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {erro}
          <button className="ml-auto text-red-500 hover:text-red-300 transition-colors" onClick={() => setErro(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {mensagem && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {mensagem}
          <button className="ml-auto text-emerald-500 hover:text-emerald-300 transition-colors" onClick={() => setMensagem(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de Roles */}
        <div className="col-span-1">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Roles</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Nova role..."
              value={novoRoleNome}
              onChange={(e) => setNovoRoleNome(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && criarRole()}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200"
            />
            <Button size="sm" icon={Plus} onClick={criarRole}>Criar</Button>
          </div>

          {loading ? (
            <p className="text-slate-600 text-sm">Carregando...</p>
          ) : (
            <ul className="space-y-1.5">
              {roles.map((role) => (
                <li key={role.id}>
                  <button
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                      roleSelecionada?.id === role.id
                        ? 'bg-cyan-600/20 border-cyan-600/40 text-cyan-300'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                    onClick={() => setRoleSelecionada(role)}
                  >
                    <span className="font-medium text-sm">{role.nome}</span>
                    {role.eh_customizado && (
                      <span className="ml-2 text-xs opacity-60">(custom)</span>
                    )}
                    <span className="block text-xs text-slate-500 mt-0.5">
                      {role.Permissaos?.length ?? 0} permissões
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Painel de Permissões */}
        <div className="col-span-2">
          {roleSelecionada ? (
            <>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
                Permissões — <span className="text-cyan-400 normal-case">{roleSelecionada.nome}</span>
              </h2>

              {Object.entries(permissoesPorCategoria).map(([categoria, perms]) => (
                <div key={categoria} className="mb-5">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
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
                              ? 'bg-cyan-500/10 border-cyan-500/30'
                              : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <div className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                            temPermissao ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600 bg-slate-700'
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
                            <span className="text-sm font-medium text-slate-200">{perm.nome}</span>
                            <span className="block text-xs text-slate-500">{perm.descricao}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-2">
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
