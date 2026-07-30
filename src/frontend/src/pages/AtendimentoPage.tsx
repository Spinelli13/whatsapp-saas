import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Clock, User, Send, CheckCircle, TrendingUp,
  Star, ChevronRight, PhoneCall, BarChart3, RefreshCw, X,
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';
import { io, Socket } from 'socket.io-client';
import RespostaRapidaDropdown from '../components/ui/RespostaRapidaDropdown';
import { useRespostasRapidas } from '../hooks/useRespostasRapidas';
import PainelNotasInternas from '../components/ui/PainelNotasInternas';
import { BotaoTransferencia } from '../components/ui/BotaoTransferencia';
import { PainelTransferenciasPendentes } from '../components/ui/PainelTransferenciasPendentes';
import { useTransferencias } from '../hooks/useTransferencias';

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Atendimento {
  id: string;
  numero_whatsapp: string;
  nome_cliente?: string;
  status: 'pendente' | 'ativo' | 'encerrado';
  prioridade: 'baixa' | 'media' | 'alta';
  setor?: string;
  ultima_mensagem?: string;
  feedback_score?: number;
  dados_cliente?: Record<string, string>;
  criado_em: string;
  atendente?: { id: number; nome: string };
}

interface Mensagem {
  id: string;
  tipo: 'entrada' | 'saida';
  mensagem: string;
  timestamp: string;
}

interface Dashboard {
  total: number;
  pendentes: number;
  ativos: number;
  encerrados: number;
  satisfacao_media: number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PRIORIDADE_COLOR: Record<string, string> = {
  alta:  'bg-red-500/20 text-red-400 border-red-500/30',
  media: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  baixa: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function tempoRelativo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff}m atrás`;
  return `${Math.floor(diff / 60)}h atrás`;
}

// ── Sub-componentes ─────────────────────────────────────────────────────────────

function CardAtendimento({
  at, onPegar, isDark,
}: { at: Atendimento; onPegar: (id: string) => void; isDark: boolean }) {
  return (
    <div className={`rounded-xl border p-4 space-y-2 transition-all hover:shadow-md ${
      isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            {at.nome_cliente || at.numero_whatsapp}
          </p>
          <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            {at.numero_whatsapp}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${PRIORIDADE_COLOR[at.prioridade]}`}>
          {at.prioridade}
        </span>
      </div>

      {at.ultima_mensagem && (
        <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          {at.ultima_mensagem}
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
          {tempoRelativo(at.criado_em)}
        </span>
        <button
          onClick={() => onPegar(at.id)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
        >
          <PhoneCall className="h-3 w-3" />
          Pegar
        </button>
      </div>
    </div>
  );
}

function BolhaMensagem({ msg, isDark }: { msg: Mensagem; isDark: boolean }) {
  const isSaida = msg.tipo === 'saida';
  return (
    <div className={`flex ${isSaida ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
        isSaida
          ? 'bg-cyan-600 text-white'
          : isDark
            ? 'bg-slate-700 text-slate-100'
            : 'bg-gray-100 text-gray-800'
      }`}>
        <p>{msg.mensagem}</p>
        <p className={`text-xs mt-1 ${isSaida ? 'text-cyan-200' : isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function AtendimentoPage() {
  const { theme } = useThemeStore();
  const usuario = useAuthStore((s) => s.usuario);
  const isDark = theme === 'dark';

  const [fila, setFila] = useState<Atendimento[]>([]);
  const [atendimentoAtivo, setAtendimentoAtivo] = useState<Atendimento | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [texto, setTexto] = useState('');
  const [feedback, setFeedback] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [atendentes, setAtendentes] = useState<{ id: number; nome: string; email: string; status_atendente?: string }[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const { respostas: respostasRapidas } = useRespostasRapidas();
  const { pendentes, carregarPendentes, aceitar: aceitarTransferencia, rejeitar: rejeitarTransferencia } = useTransferencias();

  // ── Carregamento inicial ─────────────────────────────────────────────────────

  const carregarFila = useCallback(async () => {
    try {
      const res = await apiClient.get('/atendimento/fila');
      setFila(res.data);
    } catch { /* silencioso — fila pode estar vazia */ }
  }, []);

  const carregarDashboard = useCallback(async () => {
    try {
      const res = await apiClient.get('/atendimento/stats/dashboard');
      setDashboard(res.data);
    } catch { /* silencioso */ }
  }, []);

  const carregarMensagens = useCallback(async (id: string) => {
    try {
      const res = await apiClient.get(`/atendimento/status`);
      const at = (res.data as Atendimento[]).find((a) => a.id === id);
      if (at) {
        const detail = await apiClient.get(`/atendimento/status?id=${id}`);
        // fallback: se detalhe não vier, usa as mensagens do ativo
        setMensagens((detail.data as Mensagem[]) || []);
      }
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    carregarFila();
    carregarDashboard();
    carregarPendentes();
    apiClient.get('/usuarios').then((r) => {
      const lista = Array.isArray(r.data) ? r.data : (r.data?.data || []);
      setAtendentes(lista.filter((u: { id: number }) => u.id !== usuario?.id));
    }).catch(() => {});
    const intervalo = setInterval(carregarPendentes, 30000);
    return () => clearInterval(intervalo);
  }, [carregarFila, carregarDashboard]);

  // ── Socket.io em tempo real ───────────────────────────────────────────────────

  useEffect(() => {
    if (!usuario?.cliente_id) return;

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { cliente_id: usuario.cliente_id },
    });
    socketRef.current = socket;

    socket.on('novo_atendimento', (at: Atendimento) => {
      setFila((prev) => {
        if (prev.some((a) => a.id === at.id)) return prev;
        return [at, ...prev];
      });
      carregarDashboard();
    });

    socket.on('mensagem_recebida', (msg: Mensagem & { atendimento_id: string }) => {
      if (atendimentoAtivo?.id === msg.atendimento_id) {
        setMensagens((prev) => [...prev, msg]);
      }
    });

    return () => { socket.disconnect(); };
  }, [usuario?.cliente_id]);

  // Rola chat para o final ao chegarem novas mensagens
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // ── Ações ─────────────────────────────────────────────────────────────────────

  async function pegarAtendimento(id: string) {
    try {
      setLoading(true);
      const res = await apiClient.post(`/atendimento/${id}/pegar`);
      setAtendimentoAtivo(res.data);
      setMensagens([]);
      setFila((prev) => prev.filter((a) => a.id !== id));
      carregarDashboard();
    } catch { setErro('Não foi possível pegar o atendimento.'); }
    finally { setLoading(false); }
  }

  async function enviarMensagem() {
    if (!texto.trim() || !atendimentoAtivo) return;
    try {
      const res = await apiClient.post(`/atendimento/${atendimentoAtivo.id}/mensagem`, { mensagem: texto });
      setMensagens((prev) => [...prev, res.data]);
      setTexto('');
    } catch { setErro('Falha ao enviar mensagem.'); }
  }

  async function encaminharVenda() {
    if (!atendimentoAtivo) return;
    try {
      await apiClient.post(`/atendimento/${atendimentoAtivo.id}/encaminhar`, {
        titulo: `Lead WhatsApp — ${atendimentoAtivo.nome_cliente || atendimentoAtivo.numero_whatsapp}`,
      });
      setErro(null);
      alert('Oportunidade criada no pipeline de vendas!');
    } catch { setErro('Falha ao encaminhar para vendas.'); }
  }

  async function encerrar() {
    if (!atendimentoAtivo) return;
    try {
      await apiClient.post(`/atendimento/${atendimentoAtivo.id}/encerrar`);
      if (feedback > 0) {
        await apiClient.post(`/atendimento/${atendimentoAtivo.id}/feedback`, { score: feedback });
      }
      setAtendimentoAtivo(null);
      setMensagens([]);
      setFeedback(0);
      carregarFila();
      carregarDashboard();
    } catch { setErro('Falha ao encerrar atendimento.'); }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              Central de Atendimento
            </h1>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              WhatsApp CRM — tempo real
            </p>
          </div>
        </div>
        <button
          onClick={() => { carregarFila(); carregarDashboard(); }}
          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${
            isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Erro global */}
      {erro && (
        <div className="mx-6 mt-3 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          <X className="h-4 w-4 flex-shrink-0" />
          {erro}
          <button className="ml-auto" onClick={() => setErro(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Layout 3 colunas */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Coluna 1: Fila ─────────────────────────────────────────────────── */}
        <div className={`w-72 flex-shrink-0 border-r flex flex-col ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Fila de Espera
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                fila.length > 0
                  ? 'bg-red-500/20 text-red-400'
                  : isDark ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-500'
              }`}>
                {fila.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {fila.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-40 gap-2 text-center ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                <Clock className="h-8 w-8 opacity-30" />
                <p className="text-sm">Nenhum atendimento na fila</p>
              </div>
            ) : (
              fila.map((at) => (
                <CardAtendimento
                  key={at.id}
                  at={at}
                  onPegar={pegarAtendimento}
                  isDark={isDark}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Coluna 2: Chat ativo ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {atendimentoAtivo ? (
            <>
              {/* Info do cliente */}
              <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <User className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                      {atendimentoAtivo.nome_cliente || atendimentoAtivo.numero_whatsapp}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                      {atendimentoAtivo.numero_whatsapp}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BotaoTransferencia
                    atendimentoId={atendimentoAtivo.id}
                    atendentes={atendentes}
                    onSucesso={carregarPendentes}
                  />
                  <button
                    onClick={encaminharVenda}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Venda
                  </button>
                  <button
                    onClick={encerrar}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Encerrar
                  </button>
                </div>
              </div>

              {/* Histórico de mensagens */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {mensagens.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center h-full gap-2 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                    <MessageSquare className="h-8 w-8 opacity-30" />
                    <p className="text-sm">Aguardando mensagens...</p>
                  </div>
                ) : (
                  mensagens.map((msg) => (
                    <BolhaMensagem key={msg.id} msg={msg} isDark={isDark} />
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Feedback antes de encerrar */}
              <div className={`px-4 py-2 border-t flex items-center gap-2 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                <Star className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                <span className={`text-xs flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  Feedback:
                </span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setFeedback(n)}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                      feedback >= n
                        ? 'text-amber-400'
                        : isDark ? 'text-slate-600 hover:text-slate-400' : 'text-gray-300 hover:text-gray-500'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              {/* Input de mensagem */}
              <div className={`px-4 py-3 border-t flex items-center gap-2 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                <RespostaRapidaDropdown
                  respostas={respostasRapidas}
                  isDark={isDark}
                  inputValue={texto}
                  onSelect={(conteudo) => {
                    const msg = conteudo
                      .replace(/\{\{nome\}\}/g, atendimentoAtivo?.nome_cliente || atendimentoAtivo?.numero_whatsapp || '')
                      .replace(/\{\{protocolo\}\}/g, atendimentoAtivo?.id || '');
                    setTexto(msg);
                  }}
                />
                <input
                  type="text"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
                  placeholder="Digite uma mensagem ou /atalho..."
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={enviarMensagem}
                  disabled={!texto.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className={`flex flex-col items-center justify-center h-full gap-3 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <ChevronRight className="h-8 w-8 opacity-40" />
              </div>
              <div className="text-center">
                <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Selecione um atendimento
                </p>
                <p className="text-sm mt-0.5">Pegue um da fila para começar</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Coluna 3: Métricas + Notas Internas ────────────────────────────── */}
        <div className={`w-64 flex-shrink-0 border-l flex flex-col ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
            <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Métricas
            </span>
          </div>

          <div className="overflow-y-auto p-4 space-y-3">
            {pendentes.length > 0 && (
              <PainelTransferenciasPendentes
                pendentes={pendentes}
                onAceitar={async (id) => { await aceitarTransferencia(id); carregarFila(); }}
                onRejeitar={rejeitarTransferencia}
              />
            )}

            {dashboard ? (
              <>
                {[
                  { label: 'Total',      valor: dashboard.total,      icon: BarChart3,    color: 'text-cyan-400' },
                  { label: 'Na fila',    valor: dashboard.pendentes,  icon: Clock,        color: 'text-amber-400' },
                  { label: 'Em andamento', valor: dashboard.ativos,   icon: PhoneCall,    color: 'text-blue-400' },
                  { label: 'Encerrados', valor: dashboard.encerrados, icon: CheckCircle,  color: 'text-emerald-400' },
                ].map(({ label, valor, icon: Icon, color }) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{label}</span>
                    </div>
                    <span className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{valor}</span>
                  </div>
                ))}

                {/* Satisfação */}
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Star className="h-4 w-4 text-amber-400" />
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Satisfação</span>
                  </div>
                  <p className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                    {dashboard.satisfacao_media !== null
                      ? `${dashboard.satisfacao_media} / 5`
                      : '—'}
                  </p>
                  {dashboard.satisfacao_media !== null && (
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={n <= Math.round(dashboard.satisfacao_media!) ? 'text-amber-400' : isDark ? 'text-slate-700' : 'text-gray-200'}>
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={`text-center text-sm mt-8 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                Carregando métricas...
              </div>
            )}
          </div>

          {/* Notas Internas — visível apenas quando há atendimento ativo */}
          {atendimentoAtivo && (
            <PainelNotasInternas
              atendimentoId={atendimentoAtivo.id}
              isDark={isDark}
            />
          )}
        </div>

      </div>
    </div>
  );
}
