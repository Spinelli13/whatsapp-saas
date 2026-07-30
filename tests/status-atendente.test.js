'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { loginUser } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

let tokenAdmin, tokenAtendente;
let adminId, atendenteId;

beforeAll(async () => {
  // Login retorna token; extraímos também o usuário para pegar IDs
  const [resAdmin, resAtendente] = await Promise.all([
    request(app).post('/api/auth/login').send({
      email: CREDENTIALS.ADMIN_C1.email,
      senha: CREDENTIALS.ADMIN_C1.senha,
    }),
    request(app).post('/api/auth/login').send({
      email: CREDENTIALS.ATENDENTE_C1.email,
      senha: CREDENTIALS.ATENDENTE_C1.senha,
    }),
  ]);

  tokenAdmin    = resAdmin.body.token;
  tokenAtendente = resAtendente.body.token;
  adminId       = resAdmin.body.usuario?.id;
  atendenteId   = resAtendente.body.usuario?.id;
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('Auth — Status Atendente requer autenticação', () => {
  it('GET sem token retorna 401', async () => {
    const res = await request(app).get('/api/atendente/1/status');
    expect(res.status).toBe(401);
  });

  it('PATCH sem token retorna 401', async () => {
    const res = await request(app)
      .patch('/api/atendente/1/status')
      .send({ status: 'online' });
    expect(res.status).toBe(401);
  });

  it('GET /api/atendente/listar sem token retorna 401', async () => {
    const res = await request(app).get('/api/atendente/listar');
    expect(res.status).toBe(401);
  });
});

// ── CRUD ──────────────────────────────────────────────────────────────────────

describe('CRUD — Status do Atendente', () => {
  it('GET /api/atendente/:id/status retorna status atual', async () => {
    const res = await request(app)
      .get(`/api/atendente/${atendenteId}/status`)
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('status_atendente');
    expect(['online', 'ausente', 'offline']).toContain(res.body.data.status_atendente);
  });

  it('PATCH muda para online', async () => {
    const res = await request(app)
      .patch(`/api/atendente/${atendenteId}/status`)
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({ status: 'online' });

    expect(res.status).toBe(200);
    expect(res.body.data.status_atendente).toBe('online');
  });

  it('PATCH muda para ausente', async () => {
    const res = await request(app)
      .patch(`/api/atendente/${atendenteId}/status`)
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({ status: 'ausente' });

    expect(res.status).toBe(200);
    expect(res.body.data.status_atendente).toBe('ausente');
  });

  it('PATCH muda para offline', async () => {
    const res = await request(app)
      .patch(`/api/atendente/${atendenteId}/status`)
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({ status: 'offline' });

    expect(res.status).toBe(200);
    expect(res.body.data.status_atendente).toBe('offline');
  });

  it('GET retorna nome e email do usuário', async () => {
    const res = await request(app)
      .get(`/api/atendente/${atendenteId}/status`)
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('nome');
    expect(res.body.data).toHaveProperty('email');
  });
});

// ── Validações ────────────────────────────────────────────────────────────────

describe('Validações — Status inválido', () => {
  it('PATCH com status inválido retorna 400', async () => {
    const res = await request(app)
      .patch(`/api/atendente/${atendenteId}/status`)
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({ status: 'invalido' });

    expect(res.status).toBe(400);
  });

  it('PATCH sem body retorna 400', async () => {
    const res = await request(app)
      .patch(`/api/atendente/${atendenteId}/status`)
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('GET de usuário inexistente retorna 404', async () => {
    const res = await request(app)
      .get('/api/atendente/99999/status')
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(404);
  });
});

// ── Controle de acesso ────────────────────────────────────────────────────────

describe('Acesso — apenas o próprio usuário pode mudar status', () => {
  it('atendente NÃO pode mudar status do admin — retorna 403', async () => {
    const res = await request(app)
      .patch(`/api/atendente/${adminId}/status`)
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({ status: 'online' });

    expect(res.status).toBe(403);
  });

  it('admin pode mudar seu próprio status', async () => {
    const res = await request(app)
      .patch(`/api/atendente/${adminId}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'online' });

    expect(res.status).toBe(200);
    expect(res.body.data.status_atendente).toBe('online');
  });
});

// ── Listagem ──────────────────────────────────────────────────────────────────

describe('Listagem — Atendentes por status', () => {
  it('GET /api/atendente/listar retorna todos os usuários do cliente', async () => {
    const res = await request(app)
      .get('/api/atendente/listar')
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/atendente/listar?status=offline filtra por status', async () => {
    const res = await request(app)
      .get('/api/atendente/listar?status=offline')
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((u) => {
      expect(u.status_atendente).toBe('offline');
    });
  });

  it('GET /api/atendente/listar?status=online retorna apenas online', async () => {
    // Muda atendente para online primeiro
    await request(app)
      .patch(`/api/atendente/${atendenteId}/status`)
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({ status: 'online' });

    const res = await request(app)
      .get('/api/atendente/listar?status=online')
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((u) => u.id === atendenteId)).toBe(true);
  });
});
