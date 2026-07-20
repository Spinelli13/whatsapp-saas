import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

interface Evento {
  id: string;
  titulo: string;
  data_inicio: string;
  data_fim?: string;
  tipo: string;
  cor?: string;
  local?: string;
}

interface NovaForm {
  titulo: string;
  data_inicio: string;
  tipo: string;
  cor: string;
  local: string;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TIPO_COR: Record<string, string> = {
  reuniao: '#3B82F6',
  chamada: '#8B5CF6',
  visita: '#10B981',
  deadline: '#EF4444',
  outro: '#6B7280',
};

export default function CalendarioPage() {
  const { theme } = useThemeStore();
  const token = useAuthStore((s) => s.token);
  const isDark = theme === 'dark';

  const [mesAtual, setMesAtual] = useState(new Date());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<NovaForm>({
    titulo: '', data_inicio: '', tipo: 'outro', cor: '#3B82F6', local: '',
  });
  const [salvando, setSalvando] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const carregar = useCallback(async () => {
    setLoading(true);
    const mes = mesAtual.getMonth() + 1;
    const ano = mesAtual.getFullYear();
    const res = await fetch(`/api/tarefas/calendario/eventos?mes=${mes}&ano=${ano}`, { headers });
    if (res.ok) setEventos(await res.json());
    setLoading(false);
  }, [token, mesAtual]);

  useEffect(() => { carregar(); }, [carregar]);

  async function salvar() {
    if (!form.titulo.trim() || !form.data_inicio) return;
    setSalvando(true);
    const res = await fetch('/api/tarefas/calendario/eventos', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        titulo: form.titulo,
        data_inicio: new Date(form.data_inicio).toISOString(),
        tipo: form.tipo,
        cor: form.cor,
        local: form.local || undefined,
      }),
    });
    setSalvando(false);
    if (res.ok) { setModal(false); carregar(); }
  }

  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();

  function eventosDoDia(dia: number) {
    const d = new Date(ano, mes, dia).toDateString();
    return eventos.filter((e) => new Date(e.data_inicio).toDateString() === d);
  }

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
      }`}>
        <h1 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Calendário</h1>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
        >
          <Plus className="h-4 w-4" /> Novo evento
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className={`rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          {/* Nav do mês */}
          <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
            <h2 className={`text-sm font-semibold capitalize ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              {mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setMesAtual(new Date(ano, mes - 1))}
                className={`p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMesAtual(new Date())}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                Hoje
              </button>
              <button
                onClick={() => setMesAtual(new Date(ano, mes + 1))}
                className={`p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-7 border-b">
            {DIAS_SEMANA.map((d) => (
              <div
                key={d}
                className={`py-2 text-center text-xs font-semibold ${isDark ? 'text-slate-500 border-slate-800' : 'text-gray-400'}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grade do calendário */}
          {loading ? (
            <div className={`py-16 text-center text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Carregando...
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
                <div key={`empty-${i}`} className={`min-h-[80px] border-b border-r ${isDark ? 'border-slate-800' : 'border-gray-100'}`} />
              ))}
              {Array.from({ length: diasNoMes }).map((_, i) => {
                const dia = i + 1;
                const hoje = new Date().toDateString() === new Date(ano, mes, dia).toDateString();
                const evs = eventosDoDia(dia);
                return (
                  <div
                    key={dia}
                    className={`min-h-[80px] p-1.5 border-b border-r transition-colors ${
                      hoje
                        ? isDark ? 'bg-cyan-950/30 border-slate-800' : 'bg-cyan-50 border-gray-100'
                        : isDark ? 'border-slate-800 hover:bg-slate-800/50' : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                      hoje
                        ? 'bg-cyan-500 text-white'
                        : isDark ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      {dia}
                    </div>
                    <div className="space-y-0.5">
                      {evs.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="text-xs px-1 py-0.5 rounded truncate text-white"
                          style={{ backgroundColor: ev.cor || TIPO_COR[ev.tipo] || '#6B7280' }}
                          title={ev.titulo}
                        >
                          {ev.titulo}
                        </div>
                      ))}
                      {evs.length > 2 && (
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                          +{evs.length - 2}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`w-full max-w-md rounded-xl border shadow-xl ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <h2 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Novo Evento</h2>
              <button onClick={() => setModal(false)} className={`p-1 rounded ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Título *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Data *</label>
                  <input
                    type="datetime-local"
                    value={form.data_inicio}
                    onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value, cor: TIPO_COR[e.target.value] || '#6B7280' }))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-900 focus:border-cyan-500'
                    }`}
                  >
                    <option value="reuniao">Reunião</option>
                    <option value="chamada">Chamada</option>
                    <option value="visita">Visita</option>
                    <option value="deadline">Deadline</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Local</label>
                <input
                  type="text"
                  value={form.local}
                  onChange={(e) => setForm((f) => ({ ...f, local: e.target.value }))}
                  placeholder="Sala, link, endereço..."
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-500'
                  }`}
                />
              </div>
            </div>
            <div className={`px-5 py-4 border-t flex justify-end gap-2 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
              <button onClick={() => setModal(false)} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'}`}>
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={!form.titulo.trim() || !form.data_inicio || salvando}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white"
              >
                {salvando ? 'Salvando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
