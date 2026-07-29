import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, QrCode, RefreshCw, Loader, Smartphone } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';

type WaStatus = 'nunca_conectado' | 'conectando' | 'conectado' | 'desconectado';

interface StatusResponse {
  clienteId: number;
  status: WaStatus;
  temQR: boolean;
  mensagens: number;
  reconnectAttempts: number;
}

interface QRResponse {
  clienteId: number;
  qrBase64: string | null;
  status: WaStatus;
}

const STATUS_LABEL: Record<string, string> = {
  nunca_conectado: 'Nunca conectado',
  conectando:      'Conectando...',
  conectado:       'Conectado',
  desconectado:    'Desconectado',
};

const STATUS_COLOR: Record<string, string> = {
  nunca_conectado: 'text-slate-400',
  conectando:      'text-amber-400',
  conectado:       'text-emerald-400',
  desconectado:    'text-red-400',
};

export default function WhatsappConfigPage() {
  const { isDark } = useThemeStore();
  const { usuario } = useAuthStore();
  const clienteId = usuario?.cliente_id;

  const [waStatus, setWaStatus] = useState<StatusResponse | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!clienteId) return;
    try {
      const { data } = await apiClient.get<StatusResponse>(`/whatsapp/status/${clienteId}`);
      setWaStatus(data);
      if (data.temQR) {
        const { data: qr } = await apiClient.get<QRResponse>(`/whatsapp/qr/${clienteId}`);
        setQrBase64(qr.qrBase64);
      } else {
        setQrBase64(null);
      }
    } catch {
      // silently ignore poll errors
    }
  }, [clienteId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function conectar() {
    if (!clienteId) return;
    setCarregando(true);
    setErro(null);
    try {
      await apiClient.post(`/whatsapp/conectar/${clienteId}`);
      await fetchStatus();
    } catch (e: any) {
      setErro(e.response?.data?.error || 'Erro ao iniciar conexão');
    } finally {
      setCarregando(false);
    }
  }

  async function desconectar() {
    if (!clienteId) return;
    setCarregando(true);
    setErro(null);
    try {
      await apiClient.delete(`/whatsapp/desconectar/${clienteId}`);
      setQrBase64(null);
      await fetchStatus();
    } catch (e: any) {
      setErro(e.response?.data?.error || 'Erro ao desconectar');
    } finally {
      setCarregando(false);
    }
  }

  const bg   = isDark ? 'bg-slate-900 text-white'           : 'bg-slate-50 text-slate-900';
  const card = isDark ? 'bg-slate-800 border-slate-700'     : 'bg-white border-slate-200';
  const muted = isDark ? 'text-slate-400'                   : 'text-slate-500';

  const st: WaStatus = waStatus?.status ?? 'nunca_conectado';
  const isConnected  = st === 'conectado';
  const isConnecting = st === 'conectando';

  return (
    <div className={`min-h-screen p-6 ${bg}`}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Smartphone size={28} className="text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold">WhatsApp</h1>
            <p className={`text-sm ${muted}`}>Conecte o número da sua empresa</p>
          </div>
        </div>

        {/* Status card */}
        <div className={`border rounded-xl p-6 ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Status da Conexão</h2>
            <button
              onClick={fetchStatus}
              className={`p-2 rounded-lg hover:bg-slate-700/20 transition-colors ${muted}`}
              title="Atualizar"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            {isConnected
              ? <Wifi size={22} className="text-emerald-400" />
              : <WifiOff size={22} className="text-slate-400" />}
            <span className={`text-base font-medium ${STATUS_COLOR[st]}`}>
              {STATUS_LABEL[st] ?? st}
            </span>
            {isConnecting && <Loader size={15} className="animate-spin text-amber-400" />}
          </div>

          {waStatus && (
            <p className={`text-sm ${muted} mb-5`}>
              Mensagens processadas nesta sessão: {waStatus.mensagens}
            </p>
          )}

          <div className="flex gap-3">
            {!isConnected && (
              <button
                onClick={conectar}
                disabled={carregando || isConnecting}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {carregando ? 'Aguarde...' : 'Conectar'}
              </button>
            )}
            {(isConnected || isConnecting) && (
              <button
                onClick={desconectar}
                disabled={carregando}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Desconectar
              </button>
            )}
          </div>

          {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}
        </div>

        {/* QR Code */}
        {qrBase64 && (
          <div className={`border rounded-xl p-6 ${card}`}>
            <div className="flex items-center gap-2 mb-3">
              <QrCode size={20} className="text-cyan-400" />
              <h2 className="font-semibold text-lg">Escanear QR Code</h2>
            </div>
            <p className={`text-sm ${muted} mb-5`}>
              Abra o WhatsApp → Menu (⋮) → Dispositivos conectados → Conectar dispositivo
            </p>
            <div className="flex justify-center">
              <img
                src={qrBase64}
                alt="QR Code WhatsApp"
                className="rounded-xl border-4 border-white"
                style={{ maxWidth: 280, maxHeight: 280 }}
              />
            </div>
            <p className={`text-xs ${muted} mt-4 text-center`}>
              O QR expira em ~60 segundos. Esta página atualiza automaticamente.
            </p>
          </div>
        )}

        {/* Instructions (shown when not connected and no QR) */}
        {!isConnected && !qrBase64 && (
          <div className={`border rounded-xl p-6 ${card}`}>
            <h2 className="font-semibold text-lg mb-3">Como conectar</h2>
            <ol className={`list-decimal list-inside space-y-2 text-sm ${muted}`}>
              <li>Clique em <strong>Conectar</strong> acima</li>
              <li>Um QR Code aparecerá nesta página</li>
              <li>Abra o WhatsApp no celular da empresa</li>
              <li>Vá em Menu → Dispositivos conectados → Conectar dispositivo</li>
              <li>Aponte a câmera para o QR Code</li>
              <li>A conexão será estabelecida e mantida automaticamente</li>
            </ol>
          </div>
        )}

      </div>
    </div>
  );
}
