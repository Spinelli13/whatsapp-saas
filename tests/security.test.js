'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/backend/server');
const { CREDENTIALS, CLIENTE_IDS } = require('./constants');
const { loginUser, authHeaders } = require('./helpers/auth.helper');

let tokenC1, tokenC2;

beforeAll(async () => {
  [tokenC1, tokenC2] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ADMIN_C2.email, CREDENTIALS.ADMIN_C2.senha),
  ]);
});

describe('Segurança — Autenticação', () => {
  it('requisição sem token → 401', async () => {
    const res = await request(app).get('/api/fila/departamentos/1');
    expect(res.status).toBe(401);
  });

  it('token com formato inválido → 401', async () => {
    const res = await request(app)
      .get('/api/fila/departamentos/1')
      .set('Authorization', 'Bearer nao.e.um.jwt');
    expect(res.status).toBe(401);
  });

  it('token expirado → 401', async () => {
    const expiredToken = jwt.sign(
      { id: 1, email: CREDENTIALS.ADMIN_C1.email, cliente_id: CLIENTE_IDS.C1, role: 'admin' },
      process.env.JWT_SECRET || 'dev_secret_troque_em_producao',
      { expiresIn: '-1s' }
    );
    const res = await request(app)
      .get('/api/fila/departamentos/1')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it('token sem prefixo Bearer → 401', async () => {
    const res = await request(app)
      .get('/api/fila/departamentos/1')
      .set('Authorization', tokenC1);
    expect(res.status).toBe(401);
  });
});

describe('Segurança — Isolação multi-tenant', () => {
  it('cliente 2 tentando acessar dados do cliente 1 → 403', async () => {
    const res = await request(app)
      .get('/api/fila/departamentos/1')
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(403);
  });

  it('cliente 1 tentando acessar dados do cliente 2 → 403', async () => {
    const res = await request(app)
      .get('/api/fila/departamentos/2')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(403);
  });

  it('cliente 2 tentando enfileirar no cliente 1 → 403', async () => {
    const res = await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC2))
      .send({ cliente_id: 1, telefone: '5585900000001', texto: 'oi' });
    expect(res.status).toBe(403);
  });
});

describe('Segurança — Entradas maliciosas', () => {
  it('SQL injection no email → não retorna 500 (tratado como credencial inválida)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: "' OR '1'='1'; --", senha: 'qualquer' });
    // Deve ser 401 (credencial inválida) ou 400, nunca 500
    expect(res.status).toBeLessThan(500);
    expect(res.status).not.toBe(200);
  });

  it('body vazio em login → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
  });

  it('campos extras no body são ignorados silenciosamente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        ...CREDENTIALS.ADMIN_C1,
        role: 'superadmin',          // campo extra malicioso
        cliente_id: 999,
        is_god: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.usuario.role).toBe('admin');
    expect(res.body.usuario.cliente_id).toBe(CLIENTE_IDS.C1);
  });
});
