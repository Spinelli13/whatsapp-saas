import { useState } from 'react';
import { Button } from '../ui/Button';

export function ConexaoWhatsApp() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [conectado, setConectado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGerarQR = () => {
    setLoading(true);
    // TODO: chamar /api/whatsapp/qr para gerar QR code real
    setTimeout(() => {
      const svg =
        '%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23fff" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="14" fill="%23666"%3EQR Code Placeholder%3C/text%3E%3C/svg%3E';
      setQrCode(`data:image/svg+xml,${svg}`);
      setConectado(false);
      setLoading(false);
    }, 1000);
  };

  const handleDesconectar = () => {
    // TODO: chamar /api/whatsapp/disconnect
    setQrCode(null);
    setConectado(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4">📱 Conexão WhatsApp</h2>

      {conectado ? (
        <div className="text-center">
          <div className="text-green-600 text-4xl mb-2">✅</div>
          <p className="text-lg font-bold text-green-600 mb-4">Conectado</p>
          <p className="text-gray-600 mb-4">Número: +55 85 9999-9999</p>
          <Button variant="danger" onClick={handleDesconectar}>
            Desconectar
          </Button>
        </div>
      ) : qrCode ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">Escaneie o código QR com seu celular:</p>
          <img
            src={qrCode}
            alt="QR Code"
            className="mx-auto mb-4 border-2 border-gray-300 p-2"
          />
          <p className="text-sm text-gray-500 mb-4">Aguardando confirmação...</p>
          <Button variant="secondary" onClick={() => setQrCode(null)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-gray-600 mb-4">Clique para conectar seu WhatsApp</p>
          <Button onClick={handleGerarQR} loading={loading}>
            Gerar QR Code
          </Button>
        </div>
      )}
    </div>
  );
}
