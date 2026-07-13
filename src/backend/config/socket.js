'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, FRONTEND_URL } = require('./environment');

const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Token não fornecido'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.clienteId = decoded.cliente_id;
    socket.email = decoded.email;
    return next();
  } catch {
    return next(new Error('Token inválido'));
  }
};

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Dynamic namespace: /cliente-1, /cliente-2, etc.
  const clienteNsp = io.of(/^\/cliente-\d+$/);
  clienteNsp.use(socketAuthMiddleware);

  clienteNsp.on('connection', (socket) => {
    const clienteId = socket.clienteId;
    const usuarioId = socket.userId;
    // Extract the numeric clienteId from the namespace name (/cliente-1 → 1)
    const nspId = parseInt(socket.nsp.name.replace('/cliente-', ''), 10);

    // Reject if JWT clienteId doesn't match the namespace the client connected to
    if (clienteId !== nspId) {
      socket.disconnect(true);
      return;
    }

    console.log(`[Socket] Usuário ${usuarioId} conectado ao cliente ${clienteId}`);

    socket.emit('usuario_conectado', {
      usuarioId,
      clienteId,
      timestamp: new Date(),
    });

    // Notify other users in the same client namespace
    socket.broadcast.emit('atendente_online', {
      usuarioId,
      email: socket.email,
      timestamp: new Date(),
    });

    socket.on('nova_mensagem', (data) => {
      socket.nsp.emit('mensagem_recebida', {
        ticket_id: data.ticket_id,
        telefone: data.telefone,
        texto: data.texto,
        departamento_id: data.departamento_id,
        criado_em: new Date(),
      });
    });

    socket.on('status_alterado', (data) => {
      socket.nsp.emit('ticket_status_changed', {
        ticket_id: data.ticket_id,
        novo_status: data.novo_status,
        usuario_id: data.usuario_id,
        timestamp: new Date(),
      });
    });

    socket.on('nota_adicionada', (data) => {
      socket.nsp.emit('nota_adicionada_broadcast', {
        ticket_id: data.ticket_id,
        conteudo: data.conteudo,
        usuario_id: data.usuario_id,
        privada: data.privada,
        timestamp: new Date(),
      });
    });

    socket.on('fila_atualizada', (data) => {
      socket.nsp.emit('fila_status_updated', {
        departamento_id: data.departamento_id,
        fila_count: data.fila_count,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Usuário ${usuarioId} desconectado do cliente ${clienteId}`);
      socket.broadcast.emit('atendente_offline', {
        usuarioId,
        timestamp: new Date(),
      });
    });

    socket.on('error', (error) => {
      console.error(`[Socket Error] ${error}`);
    });
  });

  return io;
};

module.exports = { initializeSocket, socketAuthMiddleware };
