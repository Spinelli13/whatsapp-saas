import { useEffect, useState } from 'react';
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
      // Refresh selected role
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
        <p className="text-red-600">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Roles e Permissões</h1>

      {erro && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded" role="alert">
          {erro}
          <button className="ml-2 underline" onClick={() => setErro(null)}>Fechar</button>
        </div>
      )}

      {mensagem && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {mensagem}
          <button className="ml-2 underline" onClick={() => setMensagem(null)}>Fechar</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de Roles */}
        <div className="col-span-1">
          <h2 className="text-lg font-semibold mb-3">Roles</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Nova role..."
              value={novoRoleNome}
              onChange={(e) => setNovoRoleNome(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm flex-1"
              onKeyDown={(e) => e.key === 'Enter' && criarRole()}
            />
            <Button size="sm" onClick={criarRole}>Criar</Button>
          </div>

          {loading ? (
            <p className="text-gray-500 text-sm">Carregando...</p>
          ) : (
            <ul className="space-y-2">
              {roles.map((role) => (
                <li key={role.id}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                      roleSelecionada?.id === role.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => setRoleSelecionada(role)}
                  >
                    <span className="font-medium">{role.nome}</span>
                    {role.eh_customizado && (
                      <span className="ml-2 text-xs opacity-75">(custom)</span>
                    )}
                    <span className="block text-xs opacity-75">
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
              <h2 className="text-lg font-semibold mb-3">
                Permissões — <span className="text-blue-600">{roleSelecionada.nome}</span>
              </h2>

              {Object.entries(permissoesPorCategoria).map(([categoria, perms]) => (
                <div key={categoria} className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {categoria}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((perm) => {
                      const temPermissao = roleSelecionada.Permissaos?.some((p) => p.id === perm.id) ?? false;
                      return (
                        <label
                          key={perm.id}
                          className="flex items-start gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={temPermissao}
                            onChange={() => togglePermissao(roleSelecionada.id, perm.id, temPermissao)}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="text-sm font-medium">{perm.nome}</span>
                            <span className="block text-xs text-gray-500">{perm.descricao}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400">
              Selecione uma role para editar suas permissões
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PermissoesPage;
