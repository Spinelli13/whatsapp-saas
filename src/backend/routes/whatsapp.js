const { Router } = require('express');
const wa = require('../services/whatsappService');
const { verificarJWT } = require('../middleware/auth');

const router = Router();

// Todos os endpoints protegidos por JWT
router.use(verificarJWT);

// Status geral de todas as conexões WhatsApp
router.get('/status', (req, res) => {
  res.json({ conexoes: wa.statusGeral() });
});

// Status de um cliente específico
router.get('/status/:cliente_id', (req, res) => {
  const clienteId = parseInt(req.params.cliente_id, 10);
  res.json(wa.getStatus(clienteId));
});

// Iniciar conexão e gerar QR
router.post('/conectar/:cliente_id', async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.cliente_id, 10);
    const resultado = await wa.conectar(clienteId);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

// Retornar QR code atual (base64 para exibir no frontend)
router.get('/qr/:cliente_id', (req, res) => {
  const clienteId = parseInt(req.params.cliente_id, 10);
  const { qrBase64, status } = wa.getQR(clienteId);

  if (!qrBase64) {
    return res.status(404).json({
      error: status === 'conectado'
        ? 'Já conectado, QR não necessário'
        : 'QR ainda não gerado. Use POST /whatsapp/conectar/:cliente_id primeiro',
      status,
    });
  }

  res.json({ clienteId, qrBase64, instrucao: 'Abra o WhatsApp → Aparelhos conectados → Escanear QR' });
});

// Enviar mensagem
router.post('/send', async (req, res, next) => {
  try {
    const { cliente_id, para, texto } = req.body;

    if (!cliente_id || !para || !texto) {
      return res.status(400).json({ error: 'cliente_id, para e texto são obrigatórios' });
    }

    const resultado = await wa.enviarMensagem(parseInt(cliente_id, 10), para, texto);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

// Listar mensagens recebidas (mock em memória)
router.get('/mensagens/:cliente_id', (req, res) => {
  const clienteId = parseInt(req.params.cliente_id, 10);
  const limite = Math.min(parseInt(req.query.limite, 10) || 50, 200);
  res.json({ clienteId, mensagens: wa.getMensagens(clienteId, limite) });
});

// Desconectar cliente
router.delete('/desconectar/:cliente_id', (req, res) => {
  const clienteId = parseInt(req.params.cliente_id, 10);
  wa.desconectar(clienteId);
  res.json({ mensagem: `Cliente ${clienteId} desconectado` });
});

module.exports = router;
