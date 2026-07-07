const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const config = require('../config/whatsapp');
const filaService = require('./filaService');

// Estado em memória por cliente_id
// { socket, status, qr, qrBase64, reconnectAttempts, messages[] }
const _clients = new Map();

// io é injetado do server.js depois que o socket está pronto
let _io = null;

function setIO(io) {
  _io = io;
}

function _emit(clienteId, event, data) {
  if (_io) {
    _io.to(`cliente_${clienteId}`).emit(event, data);
  }
}

function _sessionDir(clienteId) {
  const dir = path.join(config.SESSION_DIR, `cliente_${clienteId}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function _getClient(clienteId) {
  if (!_clients.has(clienteId)) {
    _clients.set(clienteId, {
      socket: null,
      status: 'desconectado',
      qr: null,
      qrBase64: null,
      reconnectAttempts: 0,
      messages: [],
    });
  }
  return _clients.get(clienteId);
}

async function conectar(clienteId) {
  const client = _getClient(clienteId);

  if (client.status === 'conectado') {
    return { status: 'conectado', clienteId };
  }

  if (client.status === 'conectando') {
    return { status: 'conectando', clienteId };
  }

  client.status = 'conectando';
  client.qr = null;
  client.qrBase64 = null;

  // Importação dinâmica — Baileys é ESM-only
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
  } = await import('@whiskeysockets/baileys');

  const { default: pino } = await import('pino');

  const { state, saveCreds } = await useMultiFileAuthState(_sessionDir(clienteId));
  const { version } = await fetchLatestBaileysVersion();

  const logger = pino({ level: 'silent' });

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['WhatsApp SaaS', 'Chrome', '1.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  client.socket = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      client.qr = qr;
      client.qrBase64 = await qrcode.toDataURL(qr);
      _emit(clienteId, 'whatsapp:qr', { clienteId, qrBase64: client.qrBase64 });
      console.log(`[WA] QR gerado para cliente ${clienteId}`);
    }

    if (connection === 'open') {
      client.status = 'conectado';
      client.qr = null;
      client.qrBase64 = null;
      client.reconnectAttempts = 0;
      _emit(clienteId, 'whatsapp:conectado', { clienteId });
      console.log(`[WA] Cliente ${clienteId} conectado`);
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;

      client.status = 'desconectado';
      _emit(clienteId, 'whatsapp:desconectado', { clienteId, loggedOut });
      console.log(`[WA] Cliente ${clienteId} desconectado (code=${code})`);

      if (!loggedOut && config.RECONNECT_ON_CLOSE) {
        if (client.reconnectAttempts < config.MAX_RECONNECT_ATTEMPTS) {
          client.reconnectAttempts++;
          console.log(`[WA] Reconectando cliente ${clienteId} (tentativa ${client.reconnectAttempts})`);
          setTimeout(() => conectar(clienteId), 3000);
        } else {
          console.log(`[WA] Máximo de reconexões atingido para cliente ${clienteId}`);
        }
      }

      if (loggedOut) {
        desconectar(clienteId);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;
      if (config.IGNORE_OWN_MESSAGES && msg.key.fromMe) continue;
      if (config.IGNORE_GROUPS && msg.key.remoteJid.endsWith('@g.us')) continue;

      const mensagem = _extrairMensagem(clienteId, msg);
      client.messages.push(mensagem);

      // Mantém no máximo 500 mensagens em memória por cliente
      if (client.messages.length > 500) client.messages.shift();

      _emit(clienteId, 'whatsapp:mensagem', mensagem);
      console.log(`[WA] Mensagem recebida | cliente=${clienteId} | de=${mensagem.de} | texto="${mensagem.texto}"`);

      // Roteamento para fila de departamentos
      if (mensagem.texto && mensagem.texto !== '[mídia]') {
        try {
          const resultado = filaService.receberMensagem(clienteId, mensagem.de, mensagem.texto);

          if (resultado.acao === 'enfileirado') {
            _emit(clienteId, 'fila:nova_entrada', {
              telefone: mensagem.de,
              departamento: resultado.departamento,
              posicao: resultado.posicao,
            });
          }

          if (resultado.resposta) {
            await sock.sendMessage(mensagem.de, { text: resultado.resposta });
          }
        } catch (err) {
          console.error(`[Fila] Erro ao processar mensagem do cliente ${clienteId}:`, err.message);
        }
      }
    }
  });

  return { status: 'conectando', clienteId };
}

function _extrairMensagem(clienteId, msg) {
  const texto =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    '[mídia]';

  return {
    id: msg.key.id,
    clienteId,
    de: msg.key.remoteJid,
    texto,
    timestamp: new Date((msg.messageTimestamp || Date.now() / 1000) * 1000).toISOString(),
    tipo: Object.keys(msg.message || {})[0] || 'desconhecido',
    fromMe: msg.key.fromMe,
  };
}

async function enviarMensagem(clienteId, para, texto) {
  const client = _getClient(clienteId);

  if (client.status !== 'conectado' || !client.socket) {
    const err = new Error(`Cliente ${clienteId} não está conectado`);
    err.status = 400;
    throw err;
  }

  const jid = para.includes('@') ? para : `${para}@s.whatsapp.net`;
  await client.socket.sendMessage(jid, { text: texto });

  return { enviado: true, para: jid, texto };
}

function getStatus(clienteId) {
  if (!_clients.has(clienteId)) {
    return { clienteId, status: 'nunca_conectado', mensagens: 0 };
  }
  const c = _clients.get(clienteId);
  return {
    clienteId,
    status: c.status,
    temQR: !!c.qr,
    mensagens: c.messages.length,
    reconnectAttempts: c.reconnectAttempts,
  };
}

function getQR(clienteId) {
  const client = _getClient(clienteId);
  return { clienteId, qrBase64: client.qrBase64, status: client.status };
}

function getMensagens(clienteId, limite = 50) {
  const client = _getClient(clienteId);
  return client.messages.slice(-limite);
}

function desconectar(clienteId) {
  const client = _clients.get(clienteId);
  if (!client) return;

  try {
    if (client.socket) {
      client.socket.end();
    }
  } catch {}

  _clients.delete(clienteId);
  console.log(`[WA] Cliente ${clienteId} removido`);
}

function statusGeral() {
  const result = [];
  for (const [id, c] of _clients) {
    result.push({ clienteId: id, status: c.status, mensagens: c.messages.length });
  }
  return result;
}

module.exports = {
  setIO,
  conectar,
  enviarMensagem,
  getStatus,
  getQR,
  getMensagens,
  desconectar,
  statusGeral,
};
