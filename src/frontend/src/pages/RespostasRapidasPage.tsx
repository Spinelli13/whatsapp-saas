import { useState } from 'react';
import { Plus, Pencil, Trash2, Zap, X } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useRespostasRapidas, type RespostaRapida } from '../hooks/useRespostasRapidas';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface FormState {
  titulo: string;
  conteudo: string;
  atalho: string;
}

const EMPTY: FormState = { titulo: '', conteudo: '', atalho: '' };

export default function RespostasRapidasPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const { respostas, loading, criar, atualizar, deletar } = useRespostasRapidas();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const bg   = isDark ? 'bg-slate-900 text-white'       : 'bg-slate-50 text-slate-900';
  const card = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const muted = isDark ? 'text-slate-400'               : 'text-slate-500';
  const th   = isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-100 text-slate-500';
  const tr   = isDark ? 'border-slate-700 hover:bg-slate-700/30' : 'border-slate-100 hover:bg-slate-50';

  function iniciarEdicao(r: RespostaRapida) {
    setForm({ titulo: r.titulo, conteudo: r.conteudo, atalho: r.atalho || '' });
    setEditandoId(r.id);
    setErro(null);
  }

  function cancelar() {
    setForm(EMPTY);
    setEditandoId(null);
    setErro(null);
  }

  async function salvar() {
    if (!form.titulo.trim() || !form.conteudo.trim()) {
      setErro('Título e conteúdo são obrigatórios');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      if (editandoId) {
        await atualizar(editandoId, form.titulo, form.conteudo, form.atalho || undefined);
      } else {
        await criar(form.titulo, form.conteudo, form.atalho || undefined);
      }
      cancelar();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarDeletar(id: string) {
    if (!confirm('Deletar esta resposta rápida?')) return;
    try {
      await deletar(id);
    } catch (e: any) {
      setErro(e.message);
    }
  }

  return (
    <div className={`min-h-screen p-6 ${bg}`}>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Zap size={26} className="text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold">Respostas Rápidas</h1>
            <p className={`text-sm ${muted}`}>
              Templates de mensagem reutilizáveis com suporte a variáveis (&#123;&#123;nome&#125;&#125;, &#123;&#123;protocolo&#125;&#125;)
            </p>
          </div>
        </div>

        {/* Form */}
        <div className={`border rounded-xl p-6 ${card}`}>
          <h2 className="font-semibold text-base mb-4">
            {editandoId ? 'Editar resposta' : 'Nova resposta rápida'}
          </h2>

          <div className="grid gap-4">
            <Input
              label="Título"
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Ex: Saudação inicial"
              maxLength={100}
            />

            <div className="flex flex-col gap-1.5">
              <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Conteúdo
              </label>
              <textarea
                value={form.conteudo}
                onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
                placeholder={'Olá {{nome}}, seu protocolo é {{protocolo}}. Como posso ajudar?'}
                rows={4}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              <p className={`text-xs ${muted}`}>
                Variáveis disponíveis: <code className="px-1 rounded bg-slate-700/30">{'{{nome}}'}</code> <code className="px-1 rounded bg-slate-700/30">{'{{protocolo}}'}</code>
              </p>
            </div>

            <Input
              label="Atalho (opcional)"
              value={form.atalho}
              onChange={(e) => setForm((f) => ({ ...f, atalho: e.target.value }))}
              placeholder="/ola"
              maxLength={50}
            />
            <p className={`-mt-3 text-xs ${muted}`}>
              No chat, digite o atalho para autocomplete automático.
            </p>
          </div>

          {erro && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-400 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <X size={14} />
              {erro}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <Button onClick={salvar} loading={salvando} icon={editandoId ? Pencil : Plus}>
              {editandoId ? 'Salvar alterações' : 'Adicionar'}
            </Button>
            {editandoId && (
              <Button variant="secondary" onClick={cancelar}>
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className={`border rounded-xl overflow-hidden ${card}`}>
          <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <span className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>
              {respostas.length} {respostas.length === 1 ? 'resposta cadastrada' : 'respostas cadastradas'}
            </span>
          </div>

          {loading ? (
            <div className={`p-8 text-center text-sm ${muted}`}>Carregando...</div>
          ) : respostas.length === 0 ? (
            <div className={`p-8 text-center ${muted}`}>
              <Zap size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma resposta rápida cadastrada ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={th}>
                    <th className="text-left px-4 py-2.5 font-medium">Título</th>
                    <th className="text-left px-4 py-2.5 font-medium">Atalho</th>
                    <th className="text-left px-4 py-2.5 font-medium">Conteúdo</th>
                    <th className="px-4 py-2.5 font-medium text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {respostas.map((r) => (
                    <tr key={r.id} className={`border-t ${tr}`}>
                      <td className={`px-4 py-3 font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {r.titulo}
                      </td>
                      <td className="px-4 py-3">
                        {r.atalho ? (
                          <code className={`text-xs px-2 py-0.5 rounded font-mono ${isDark ? 'bg-slate-700 text-cyan-400' : 'bg-slate-100 text-cyan-700'}`}>
                            {r.atalho}
                          </code>
                        ) : (
                          <span className={muted}>—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 max-w-xs ${muted}`}>
                        <p className="line-clamp-2">{r.conteudo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => iniciarEdicao(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => confirmarDeletar(r.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Deletar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
