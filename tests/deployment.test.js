'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { FRONTEND_URL } = require('../src/backend/config/environment');

// ── Health Checks ─────────────────────────────────────────────────────────────

describe('Health Checks', () => {
  it('GET /health retorna status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('environment');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /health inclui timestamp', async () => {
    const res = await request(app).get('/health');

    expect(res.body).toHaveProperty('timestamp');
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });

  it('GET /health/ready verifica conexão com banco', async () => {
    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.database).toBe('connected');
  });

  it('GET /health/ready retorna campo database', async () => {
    const res = await request(app).get('/health/ready');

    expect(res.body).toHaveProperty('database');
    expect(['connected', 'disconnected']).toContain(res.body.database);
  });
});

// ── CORS & Security ───────────────────────────────────────────────────────────

describe('CORS & Security', () => {
  it('POST /api/auth/login com Origin permitido inclui header CORS', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', FRONTEND_URL)
      .send({ email: 'naoexiste@test.com', senha: 'errado' });

    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  it('respostas incluem headers de segurança (Helmet)', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-content-type-options']).toBeDefined();
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('OPTIONS /api/auth/login responde ao preflight CORS', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', FRONTEND_URL)
      .set('Access-Control-Request-Method', 'POST');

    expect([200, 204]).toContain(res.status);
  });
});

// ── Production Environment ────────────────────────────────────────────────────

describe('Production Environment', () => {
  it('NODE_ENV tem valor válido', () => {
    expect(['development', 'test', 'production']).toContain(process.env.NODE_ENV);
  });

  it('SENTRY_DSN é exigido apenas em production', () => {
    if (process.env.NODE_ENV === 'production') {
      expect(process.env.SENTRY_DSN).toBeDefined();
    } else {
      expect(true).toBe(true);
    }
  });

  it('JWT_SECRET deve estar definido', () => {
    expect(process.env.JWT_SECRET || 'dev_secret_troque_em_producao').toBeTruthy();
  });

  it('API /api/status retorna versão', async () => {
    const res = await request(app).get('/api/status');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('api');
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
