import { useState } from 'react';
import { Shield, Smartphone, Key, AlertTriangle, CheckCircle2, X, QrCode } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

type Stage = 'menu' | 'setup-totp' | 'setup-sms' | 'confirm-sms';

interface TOTPSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export function SecurityPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const [stage, setStage] = useState<Stage>('menu');
  const [totpSetup, setTotpSetup] = useState<TOTPSetup | null>(null);
  const [totpToken, setTotpToken] = useState('');
  const [telefone, setTelefone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSetupTOTP() {
    setLoading(true);
    setErro(null);
    try {
      const res = await apiClient.post('/auth/2fa/setup-totp');
      setTotpSetup(res.data);
      setStage('setup-totp');
    } catch {
      setErro('Erro ao configurar 2FA');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmTOTP() {
    if (!totpSetup || !totpToken) return;
    setLoading(true);
    setErro(null);
    try {
      const res = await apiClient.post('/auth/2fa/confirm-totp', {
        secret: totpSetup.secret,
        token: totpToken,
      });
      setBackupCodes(res.data.backupCodes || []);
      setMensagem('2FA via Authenticator ativado com sucesso!');
      setStage('menu');
      setTotpSetup(null);
      setTotpToken('');
    } catch {
      setErro('Token inválido. Verifique o código no seu app.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetupSMS() {
    if (!telefone) return;
    setLoading(true);
    setErro(null);
    try {
      await apiClient.post('/auth/2fa/setup-sms', { telefone });
      setStage('confirm-sms');
    } catch {
      setErro('Erro ao enviar SMS');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSMS() {
    if (!smsCode) return;
    setLoading(true);
    setErro(null);
    try {
      await apiClient.post('/auth/2fa/confirm-sms', { telefone, codigo: smsCode });
      setMensagem('2FA via SMS ativado com sucesso!');
      setStage('menu');
      setTelefone('');
      setSmsCode('');
    } catch {
      setErro('Código inválido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Segurança da Conta</h1>
      </div>

      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm" role="alert">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {erro}
          <button className="ml-auto" onClick={() => setErro(null)}><X className="h-4 w-4" /></button>
        </div>
      )}
      {mensagem && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {mensagem}
          <button className="ml-auto" onClick={() => setMensagem(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {backupCodes.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-4 w-4 text-amber-400" />
            <h3 className="font-semibold text-amber-300">Guarde seus códigos de backup:</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code) => (
              <code key={code} className="font-mono text-sm bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-center">
                {code}
              </code>
            ))}
          </div>
          <p className="mt-3 text-xs text-amber-500/80">
            Cada código pode ser usado apenas uma vez para acessar sua conta se perder o 2FA.
          </p>
        </div>
      )}

      {/* Menu principal */}
      {stage === 'menu' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-4">
          <p className="text-sm text-slate-400">
            Usuário: <span className="text-slate-200 font-medium">{usuario?.email}</span>
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button icon={Smartphone} onClick={handleSetupTOTP} loading={loading}>
              Configurar Authenticator
            </Button>
            <Button variant="secondary" icon={Shield} onClick={() => setStage('setup-sms')}>
              Configurar SMS
            </Button>
          </div>
        </div>
      )}

      {/* Setup TOTP */}
      {stage === 'setup-totp' && totpSetup && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-slate-100">Configurar Authenticator</h2>
          </div>
          <p className="text-sm text-slate-400">
            Escaneie o QR Code com Google Authenticator, Authy ou similar.
          </p>
          <div className="p-3 bg-white rounded-xl w-fit">
            <img src={totpSetup.qrCode} alt="QR Code 2FA" className="w-44 h-44" />
          </div>
          <p className="text-xs text-slate-500 font-mono break-all bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
            {totpSetup.secret}
          </p>
          <Input
            label="Código do Authenticator"
            value={totpToken}
            onChange={(e) => setTotpToken(e.target.value)}
            placeholder="123456"
            maxLength={6}
          />
          <div className="flex gap-2">
            <Button onClick={handleConfirmTOTP} loading={loading}>Confirmar</Button>
            <Button variant="secondary" onClick={() => { setStage('menu'); setTotpSetup(null); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Setup SMS */}
      {stage === 'setup-sms' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-slate-100">Configurar SMS</h2>
          </div>
          <Input
            label="Número de Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="+5585999999999"
            type="tel"
          />
          <div className="flex gap-2">
            <Button onClick={handleSetupSMS} loading={loading}>Enviar Código</Button>
            <Button variant="secondary" onClick={() => setStage('menu')}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Confirm SMS */}
      {stage === 'confirm-sms' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Confirmar Código SMS</h2>
          <p className="text-sm text-slate-400">
            Enviamos um código para <span className="text-slate-200 font-medium">{telefone}</span>.
          </p>
          <Input
            label="Código SMS"
            value={smsCode}
            onChange={(e) => setSmsCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
          />
          <div className="flex gap-2">
            <Button onClick={handleConfirmSMS} loading={loading}>Confirmar</Button>
            <Button variant="secondary" onClick={() => setStage('setup-sms')}>Reenviar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityPage;
