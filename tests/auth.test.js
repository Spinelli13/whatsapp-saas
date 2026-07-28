'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/backend/server');
const { CREDENTIALS, CLIENTE_IDS } = require('./constants');

describe('Auth — POST /api/auth/login', () => {
  it('deve fazer login com credenciais corretas (cliente 1)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send(CREDENTIALS.ADMIN_C1);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.token).toMatch(/^eyJ/);
    expect(res.body).toHaveProperty('usuario');
    expect(res.body.usuario.email).toBe(CREDENTIALS.ADMIN_C1.email);
    expect(res.body.usuario.cliente_id).toBe(CLIENTE_IDS.C1);
    expect(res.body.usuario.role).toBe('admin');
    expect(res.body.usuario).not.toHaveProperty('senha');
  });

  it('deve fazer login com credenciais corretas (atendente)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send(CREDENTIALS.ATENDENTE_C1);

    expect(res.status).toBe(200);
    expect(res.body.usuario.cliente_id).toBe(CLIENTE_IDS.C1);
    expect(res.body.usuario.role).toBe('atendente');
  });

  it('deve rejeitar senha incorreta → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.ADMIN_C1.email, senha: 'senha_errada' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar email inexistente → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@test.com', senha: 'password123' });

    expect(res.status).toBe(401);
  });

  it('deve rejeitar requisição sem email → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ senha: 'password123' });

    expect(res.status).toBe(400);
  });

  it('deve rejeitar requisição sem senha → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.ADMIN_C1.email });

    expect(res.status).toBe(400);
  });

  it('token JWT deve ter payload correto', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send(CREDENTIALS.ADMIN_C1);

    const decoded = jwt.decode(res.body.token);
    expect(decoded).toHaveProperty('id');
    expect(decoded).toHaveProperty('email', CREDENTIALS.ADMIN_C1.email);
    expect(decoded).toHaveProperty('cliente_id', CLIENTE_IDS.C1);
    expect(decoded).toHaveProperty('role', 'admin');
    expect(decoded).toHaveProperty('exp');
    // Token deve expirar em ~24h
    expect(decoded.exp - decoded.iat).toBeGreaterThan(23 * 3600);
  });

  it('admin e atendente do mesmo cliente têm o mesmo cliente_id no token', async () => {
    const [res1, res2] = await Promise.all([
      request(app).post('/api/auth/login').send(CREDENTIALS.ADMIN_C1),
      request(app).post('/api/auth/login').send(CREDENTIALS.ATENDENTE_C1),
    ]);

    const d1 = jwt.decode(res1.body.token);
    const d2 = jwt.decode(res2.body.token);
    expect(d1.cliente_id).toBe(CLIENTE_IDS.C1);
    expect(d2.cliente_id).toBe(CLIENTE_IDS.C1);
    expect(d1.role).toBe('admin');
    expect(d2.role).toBe('atendente');
  });
});

describe('Auth — GET /api/auth/verify', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send(CREDENTIALS.ADMIN_C1);
    token = res.body.token;
  });

  it('deve validar token correto → 200', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.valido).toBe(true);
    expect(res.body.usuario).toHaveProperty('email');
  });

  it('deve rejeitar requisição sem token → 401', async () => {
    const res = await request(app).get('/api/auth/verify');
    expect(res.status).toBe(401);
  });

  it('deve rejeitar token malformado → 401', async () => {
    const res = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', 'Bearer token.invalido.aqui');

    expect(res.status).toBe(401);
  });
});
