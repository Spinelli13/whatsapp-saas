import { useState } from 'react';
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
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Segurança da Conta</h1>

      {erro && (
        <div className="p-3 rounded bg-red-100 text-red-700 text-sm" role="alert">
          {erro}
        </div>
      )}
      {mensagem && (
        <div className="p-3 rounded bg-green-100 text-green-700 text-sm">
          {mensagem}
        </div>
      )}

      {backupCodes.length > 0 && (
        <div className="p-4 rounded border border-yellow-300 bg-yellow-50">
          <h3 className="font-semibold mb-2">Guarde seus códigos de backup:</h3>
          <div className="grid grid-cols-2 gap-1">
            {backupCodes.map((code) => (
              <code key={code} className="font-mono text-sm bg-white px-2 py-1 rounded border">
                {code}
              </code>
            ))}
          </div>
          <p className="mt-2 text-xs text-yellow-700">
            Cada código pode ser usado apenas uma vez para acessar sua conta se perder o 2FA.
          </p>
        </div>
      )}

      {/* Menu principal */}
      {stage === 'menu' && (
        <div className="space-y-3">
          <p className="text-gray-600 text-sm">
            Usuário: <strong>{usuario?.email}</strong>
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleSetupTOTP} loading={loading}>
              Configurar Authenticator (TOTP)
            </Button>
            <Button variant="secondary" onClick={() => setStage('setup-sms')}>
              Configurar SMS
            </Button>
          </div>
        </div>
      )}

      {/* Setup TOTP */}
      {stage === 'setup-totp' && totpSetup && (
        <div className="rounded-lg border bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold">Configurar Authenticator</h2>
          <p className="text-sm text-gray-600">
            Escaneie o QR Code com Google Authenticator, Authy ou similar.
          </p>
          <img src={totpSetup.qrCode} alt="QR Code 2FA" className="w-48 h-48 border rounded" />
          <p className="text-xs text-gray-500 font-mono break-all">
            Secret: {totpSetup.secret}
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
        <div className="rounded-lg border bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold">Configurar SMS</h2>
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
        <div className="rounded-lg border bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold">Confirmar Código SMS</h2>
          <p className="text-sm text-gray-600">
            Enviamos um código para <strong>{telefone}</strong>.
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
