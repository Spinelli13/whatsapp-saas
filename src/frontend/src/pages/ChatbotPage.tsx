import { useState, useEffect } from 'react';
import { Plus, Trash2, Play, Save, Zap } from 'lucide-react';
import { useFluxosBot, FluxoBot } from '../hooks/useFluxosBot';
import { useThemeStore } from '../store/themeStore';
import FlowEditorCanvas from '../components/ui/FlowEditorCanvas';

export default function ChatbotPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { fluxos, loading, criar, atualizar, ativar, deletar, testar } = useFluxosBot();

  const [fluxoSelecionado, setFluxoSelecionado] = useState<string | null>(null);
  const [estruturaLocal, setEstruturaLocal] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [novoNome, setNovoNome] = useState('');
  const [respostaTeste, setRespostaTeste] = useState('');
  const [resultadoTeste, setResultadoTeste] = useState<any | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);

  const fluxoAtivo = fluxos.find((f) => f.id === fluxoSelecionado) || null;

  useEffect(() => {
    if (fluxoAtivo) {
      setEstruturaLocal(fluxoAtivo.estrutura_json || { nodes: [], edges: [] });
      setResultadoTeste(null);
    }
  }, [fluxoSelecionado]);

  const handleCriar = async () => {
    if (!novoNome.trim()) return;
    try {
      const novo = await criar(novoNome.trim());
      setNovoNome('');
      setFluxoSelecionado(novo.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSalvar = async () => {
    if (!fluxoAtivo) return;
    try {
      setSalvando(true);
      await atualizar(fluxoAtivo.id, { estrutura_json: estruturaLocal });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleTestar = async () => {
    if (!fluxoAtivo) return;
    try {
      setTestando(true);
      const resultado = await testar(estruturaLocal, respostaTeste);
      setResultadoTeste(resultado);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTestando(false);
    }
  };

  const handleDeletar = async (id: string) => {
    if (!window.confirm('Excluir este fluxo?')) return;
    await deletar(id);
    if (fluxoSelecionado === id) setFluxoSelecionado(null);
  };

  const cardBase = `rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Chatbot / Flow Builder
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            Crie fluxos automáticos de atendimento
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-0">
        {/* ── Coluna esquerda: lista de fluxos ── */}
        <div className={`w-64 flex-shrink-0 border-r flex flex-col ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
            <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Fluxos
            </span>
          </div>

          {/* Criar novo fluxo */}
          <div className={`px-3 py-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCriar()}
                placeholder="Nome do fluxo..."
                className={`flex-1 px-2.5 py-1.5 rounded text-xs border focus:outline-none focus:ring-1 focus:ring-violet-500/30 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-600'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
              <button
                onClick={handleCriar}
                disabled={!novoNome.trim()}
                className="px-2 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
            {loading ? (
              <p className={`text-xs text-center py-4 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>Carregando...</p>
            ) : fluxos.length === 0 ? (
              <p className={`text-xs text-center py-4 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>Nenhum fluxo ainda</p>
            ) : (
              fluxos.map((fluxo) => (
                <div
                  key={fluxo.id}
                  onClick={() => setFluxoSelecionado(fluxo.id)}
                  className={`p-3 rounded-lg cursor-pointer border transition-all ${
                    fluxoSelecionado === fluxo.id
                      ? isDark ? 'bg-violet-900/30 border-violet-500/50' : 'bg-violet-50 border-violet-300'
                      : isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                        {fluxo.nome}
                      </p>
                      <span className={`text-xs ${fluxo.ativo ? 'text-green-500' : isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                        {fluxo.ativo ? '● Ativo' : '○ Inativo'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletar(fluxo.id); }}
                      className="flex-shrink-0 text-red-400 hover:text-red-300 ml-1 mt-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {!fluxo.ativo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); ativar(fluxo.id); }}
                      className="mt-2 w-full text-xs py-0.5 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                    >
                      Ativar
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Área principal: editor ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {fluxoAtivo ? (
            <>
              {/* Toolbar */}
              <div className={`px-4 py-2.5 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                  {fluxoAtivo.nome}
                  {fluxoAtivo.ativo && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">ativo</span>
                  )}
                </span>
                <button
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 transition-colors"
                >
                  <Save size={13} />
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

              {/* Canvas */}
              <div className="flex-1 p-4 overflow-hidden">
                <FlowEditorCanvas
                  estrutura={estruturaLocal}
                  onMudar={setEstruturaLocal}
                />
              </div>

              {/* Testador */}
              <div className={`border-t px-4 py-3 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Testador de Fluxo
                </p>
                <div className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={respostaTeste}
                    onChange={(e) => setRespostaTeste(e.target.value)}
                    placeholder="Simular mensagem do usuário..."
                    className={`flex-1 px-2.5 py-1.5 rounded text-xs border ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-600'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <button
                    onClick={handleTestar}
                    disabled={testando}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    <Play size={12} />
                    {testando ? '...' : 'Testar'}
                  </button>
                </div>
                {resultadoTeste && (
                  <div className={`mt-2 p-2.5 rounded text-xs font-mono overflow-x-auto ${
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {resultadoTeste.passos?.map((p: any, i: number) => (
                      <div key={i} className="py-0.5">
                        {p.resultado
                          ? <span className="text-amber-400 font-semibold">{p.resultado}</span>
                          : <span>[{p.tipo}] {p.conteudo || '—'}</span>
                        }
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`flex flex-col items-center justify-center h-full gap-3 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <Zap className="h-8 w-8 opacity-40" />
              </div>
              <div className="text-center">
                <p className={`font-medium text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Selecione ou crie um fluxo
                </p>
                <p className="text-xs mt-0.5">Use o painel esquerdo para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
