'use strict';

const ioClient = require('socket.io-client');
const http = require('http');
const express = require('express');
const jwt = require('jsonwebtoken');
const { initializeSocket } = require('../src/backend/config/socket');
const { JWT_SECRET } = require('../src/backend/config/environment');

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Valid JWT tokens for tests (generated at module load — never expired during test run)
const tokenC1 = jwt.sign(
  { id: 2, email: 'admin@cliente1.com', cliente_id: 1, role: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

describe('Socket.io — Real-time Communication', () => {
  let httpServer, io;
  const allSockets = [];

  function makeSocket(nsp = '/cliente-1', token = tokenC1) {
    const s = ioClient(`${BASE_URL}${nsp}`, {
      auth: token ? { token } : {},
      reconnection: false,
      timeout: 3000,
    });
    allSockets.push(s);
    return s;
  }

  function connectAndWait(nsp = '/cliente-1', token = tokenC1) {
    return new Promise((resolve, reject) => {
      const s = makeSocket(nsp, token);
      s.once('connect', () => resolve(s));
      s.once('connect_error', reject);
    });
  }

  beforeAll((done) => {
    const app = express();
    httpServer = http.createServer(app);
    io = initializeSocket(httpServer);
    httpServer.listen(PORT, done);
  });

  afterAll((done) => {
    allSockets.forEach((s) => { try { s.disconnect(); } catch {} });
    // io.close() internally closes httpServer via engine.io — don't close twice
    io.close(done);
  });

  // ── Autenticação ──────────────────────────────────────────────────────────

  it('deve conectar com token JWT válido', async () => {
    const s = await connectAndWait();
    expect(s.connected).toBe(true);
    s.disconnect();
  });

  it('deve rejeitar conexão sem token', (done) => {
    const s = makeSocket('/cliente-1', null);
    s.on('connect_error', (err) => {
      expect(err.message).toBe('Token não fornecido');
      s.disconnect();
      done();
    });
    s.on('connect', () => {
      s.disconnect();
      done(new Error('Deveria ter rejeitado sem token'));
    });
  });

  it('deve rejeitar token inválido', (done) => {
    const s = makeSocket('/cliente-1', 'bad.token.here');
    s.on('connect_error', (err) => {
      expect(err.message).toBe('Token inválido');
      s.disconnect();
      done();
    });
    s.on('connect', () => {
      s.disconnect();
      done(new Error('Deveria ter rejeitado token inválido'));
    });
  });

  // ── Eventos de conexão ────────────────────────────────────────────────────

  it('deve emitir usuario_conectado ao conectar', (done) => {
    const s = makeSocket();
    s.on('usuario_conectado', (data) => {
      expect(data).toHaveProperty('usuarioId');
      expect(data).toHaveProperty('clienteId');
      expect(data).toHaveProperty('timestamp');
      s.disconnect();
      done();
    });
    s.on('connect_error', (err) => { s.disconnect(); done(err); });
  });

  it('deve receber mensagem_recebida ao emitir nova_mensagem', (done) => {
    connectAndWait().then((s) => {
      s.on('mensagem_recebida', (data) => {
        expect(data).toHaveProperty('ticket_id');
        expect(data).toHaveProperty('texto');
        expect(data).toHaveProperty('criado_em');
        s.disconnect();
        done();
      });
      s.emit('nova_mensagem', {
        ticket_id: 'test-uuid',
        telefone: '5585999990001',
        texto: 'Teste socket',
        departamento_id: 1,
      });
    }).catch(done);
  });

  it('deve receber ticket_status_changed ao emitir status_alterado', (done) => {
    connectAndWait().then((s) => {
      s.on('ticket_status_changed', (data) => {
        expect(data).toHaveProperty('ticket_id');
        expect(['novo', 'respondendo', 'resolvido', 'fechado', 'reaberto']).toContain(data.novo_status);
        s.disconnect();
        done();
      });
      s.emit('status_alterado', {
        ticket_id: 'test-uuid',
        novo_status: 'respondendo',
        usuario_id: 2,
      });
    }).catch(done);
  });

  it('deve receber nota_adicionada_broadcast ao emitir nota_adicionada', (done) => {
    connectAndWait().then((s) => {
      s.on('nota_adicionada_broadcast', (data) => {
        expect(data).toHaveProperty('ticket_id');
        expect(data).toHaveProperty('conteudo');
        expect(data).toHaveProperty('privada');
        s.disconnect();
        done();
      });
      s.emit('nota_adicionada', {
        ticket_id: 'test-uuid',
        conteudo: 'Nota de teste',
        usuario_id: 2,
        privada: false,
      });
    }).catch(done);
  });

  it('deve emitir atendente_online quando segundo usuário conecta', (done) => {
    connectAndWait().then((s1) => {
      s1.on('atendente_online', (data) => {
        expect(data).toHaveProperty('email');
        expect(data).toHaveProperty('timestamp');
        s1.disconnect();
        done();
      });
      // s2 connects after listener is set → triggers atendente_online broadcast to s1
      const s2 = makeSocket();
      s2.on('connect_error', (err) => { s1.disconnect(); done(err); });
    }).catch(done);
  });

  it('isolação multi-tenant: socket deve estar no namespace /cliente-N', (done) => {
    connectAndWait('/cliente-1').then((s) => {
      expect(s.nsp).toBe('/cliente-1');
      s.disconnect();
      done();
    }).catch(done);
  });
});
