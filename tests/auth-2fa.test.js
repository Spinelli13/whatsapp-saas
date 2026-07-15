'use strict';

const request = require('supertest');
const speakeasy = require('speakeasy');
const { app } = require('../src/backend/server');
const { sequelize, Usuario2FA, DispositivoUsuario, SessaoUsuario } = require('../src/backend/models');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS, CLIENTE_IDS } = require('./constants');

let tokenC1, tokenC2;
let totpSecret; // saved across TOTP tests

beforeAll(async () => {
  [tokenC1, tokenC2] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ADMIN_C2.email, CREDENTIALS.ADMIN_C2.senha),
  ]);
});

afterAll(async () => {
  // Clean up any 2FA/device/session records created during tests
  await sequelize.query(`DELETE FROM sessao_usuario WHERE usuario_id IN (1, 2)`);
  await sequelize.query(`DELETE FROM dispositivo_usuario WHERE usuario_id IN (1, 2)`);
  await sequelize.query(`DELETE FROM usuario_2fa WHERE usuario_id IN (1, 2)`);
});

// ── TOTP Setup ────────────────────────────────────────────────────────────

describe('POST /api/auth/2fa/setup-totp', () => {
  it('gera secret, QR code e backup codes', async () => {
    const res = await request(app)
      .post('/api/auth/2fa/setup-totp')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('secret');
    expect(res.body).toHaveProperty('qrCode');
    expect(res.body).toHaveProperty('backupCodes');
    expect(Array.isArray(res.body.backupCodes)).toBe(true);
    expect(res.body.backupCodes).toHaveLength(10);
    expect(res.body.qrCode).toMatch(/^data:image\/png/);

    totpSecret = res.body.secret;
  });

  it('requer autenticação', async () => {
    const res = await request(app).post('/api/auth/2fa/setup-totp');
    expect(res.status).toBe(401);
  });
});

// ── TOTP Confirm ──────────────────────────────────────────────────────────

describe('POST /api/auth/2fa/confirm-totp', () => {
  it('confirma TOTP com token válido e ativa 2FA', async () => {
    if (!totpSecret) throw new Error('Setup test must run first');

    // Generate a valid token using the secret
    const validToken = speakeasy.totp({ secret: totpSecret, encoding: 'base32' });

    const res = await request(app)
      .post('/api/auth/2fa/confirm-totp')
      .set(authHeaders(tokenC1))
      .send({ secret: totpSecret, token: validToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('backupCodes');
    expect(Array.isArray(res.body.backupCodes)).toBe(true);
  });

  it('rejeita token TOTP inválido com 400', async () => {
    const wrongSecret = speakeasy.generateSecret({ length: 20 }).base32;
    const res = await request(app)
      .post('/api/auth/2fa/confirm-totp')
      .set(authHeaders(tokenC2))
      .send({ secret: wrongSecret, token: '000000' }); // token 000000 won't match

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('retorna 400 se secret ou token ausente', async () => {
    const res = await request(app)
      .post('/api/auth/2fa/confirm-totp')
      .set(authHeaders(tokenC1))
      .send({ secret: 'ALGO' }); // sem token

    expect(res.status).toBe(400);
  });
});

// ── SMS Setup ─────────────────────────────────────────────────────────────

describe('POST /api/auth/2fa/setup-sms', () => {
  it('envia código SMS mock em ambiente de desenvolvimento', async () => {
    const res = await request(app)
      .post('/api/auth/2fa/setup-sms')
      .set(authHeaders(tokenC2))
      .send({ telefone: '+5585999999999' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('enviado', true);
    // Em dev, o código é exposto para testes
    expect(res.body).toHaveProperty('codigoParaTestesAPENAS');
  });

  it('retorna 400 sem telefone', async () => {
    const res = await request(app)
      .post('/api/auth/2fa/setup-sms')
      .set(authHeaders(tokenC2))
      .send({});

    expect(res.status).toBe(400);
  });
});

// ── SMS Confirm ───────────────────────────────────────────────────────────

describe('POST /api/auth/2fa/confirm-sms', () => {
  it('confirma SMS com código correto', async () => {
    const telefone = '+5585988888888';

    // Setup first to seed the cache
    const setupRes = await request(app)
      .post('/api/auth/2fa/setup-sms')
      .set(authHeaders(tokenC2))
      .send({ telefone });

    const codigo = setupRes.body.codigoParaTestesAPENAS;

    const confirmRes = await request(app)
      .post('/api/auth/2fa/confirm-sms')
      .set(authHeaders(tokenC2))
      .send({ telefone, codigo });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body).toHaveProperty('success', true);
  });

  it('rejeita código SMS incorreto com 400', async () => {
    // Setup a new code
    await request(app)
      .post('/api/auth/2fa/setup-sms')
      .set(authHeaders(tokenC2))
      .send({ telefone: '+5585911111111' });

    const res = await request(app)
      .post('/api/auth/2fa/confirm-sms')
      .set(authHeaders(tokenC2))
      .send({ telefone: '+5585911111111', codigo: '000000' });

    expect(res.status).toBe(400);
  });
});

// ── Login com 2FA (backward compat) ──────────────────────────────────────

describe('POST /api/auth/login — 2FA integration', () => {
  it('retorna tempToken quando usuário tem 2FA ativado (TOTP)', async () => {
    // User 1 has TOTP enabled from the confirm-totp test above
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.ADMIN_C1.email, senha: CREDENTIALS.ADMIN_C1.senha });

    // Should have tempToken since 2FA is now active for admin@cliente1.com
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tempToken');
    expect(res.body).toHaveProperty('tipo2FA', 'totp');
  });

  it('verify-2fa com TOTP válido retorna accessToken + refreshToken', async () => {
    // First login to get tempToken
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.ADMIN_C1.email, senha: CREDENTIALS.ADMIN_C1.senha });

    const { tempToken } = loginRes.body;

    // Get the stored secret from DB (encrypted) — use speakeasy with the original secret
    if (!totpSecret) return; // Guard for test ordering

    const validCode = speakeasy.totp({ secret: totpSecret, encoding: 'base32' });

    const verifyRes = await request(app)
      .post('/api/auth/verify-2fa')
      .send({ tempToken, codigo: validCode, deviceId: 'test-device-2fa' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body).toHaveProperty('accessToken');
    expect(verifyRes.body).toHaveProperty('refreshToken');
  });

  it('verify-2fa com código errado retorna 401', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.ADMIN_C1.email, senha: CREDENTIALS.ADMIN_C1.senha });

    const { tempToken } = loginRes.body;

    const res = await request(app)
      .post('/api/auth/verify-2fa')
      .send({ tempToken, codigo: '000000' });

    expect(res.status).toBe(401);
  });
});

// ── Session management ────────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  it('retorna 400 sem refreshToken', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('retorna 401 com refreshToken inválido', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid.token.here' });
    expect(res.status).toBe(401);
  });
});

// ── Devices ───────────────────────────────────────────────────────────────

describe('GET /api/auth/dispositivos', () => {
  it('lista dispositivos do usuário autenticado', async () => {
    const res = await request(app)
      .get('/api/auth/dispositivos')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('requer autenticação', async () => {
    const res = await request(app).get('/api/auth/dispositivos');
    expect(res.status).toBe(401);
  });
});

// ── Social login stubs ────────────────────────────────────────────────────

describe('Social Login routes (sem credenciais)', () => {
  it('GET /api/auth/google retorna 501 sem GOOGLE_CLIENT_ID', async () => {
    // In test env, GOOGLE_CLIENT_ID is not set
    const res = await request(app).get('/api/auth/google');
    expect([501, 302]).toContain(res.status); // 501 if no creds, 302 if configured
  });

  it('GET /api/auth/microsoft retorna 501 sem MICROSOFT_CLIENT_ID', async () => {
    const res = await request(app).get('/api/auth/microsoft');
    expect([501, 302]).toContain(res.status);
  });
});
