'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

let tokenC1, tokenC2;
let emailIdC1, smsIdC1;

beforeAll(async () => {
  await sequelize.query(`DELETE FROM emails WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM sms WHERE cliente_id IN (1,2)`);

  [tokenC1, tokenC2] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ADMIN_C2.email, CREDENTIALS.ADMIN_C2.senha),
  ]);
});

afterAll(async () => {
  await sequelize.query(`DELETE FROM emails WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM sms WHERE cliente_id IN (1,2)`);
});

// ── Auth guards ───────────────────────────────────────────────────────────────

describe('Auth - Comunicação endpoints requerem autenticação', () => {
  it('GET /api/comunicacao/emails retorna 401 sem token', async () => {
    const res = await request(app).get('/api/comunicacao/emails');
    expect(res.status).toBe(401);
  });

  it('POST /api/comunicacao/emails retorna 401 sem token', async () => {
    const res = await request(app).post('/api/comunicacao/emails').send({ assunto: 'Teste' });
    expect(res.status).toBe(401);
  });

  it('GET /api/comunicacao/sms retorna 401 sem token', async () => {
    const res = await request(app).get('/api/comunicacao/sms');
    expect(res.status).toBe(401);
  });

  it('POST /api/comunicacao/sms retorna 401 sem token', async () => {
    const res = await request(app).post('/api/comunicacao/sms').send({ mensagem: 'Teste' });
    expect(res.status).toBe(401);
  });
});

// ── Email CRUD ────────────────────────────────────────────────────────────────

describe('Email - CRUD', () => {
  it('GET /api/comunicacao/emails retorna lista vazia inicialmente', async () => {
    const res = await request(app)
      .get('/api/comunicacao/emails')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('POST /api/comunicacao/emails retorna 400 sem destinatario_email', async () => {
    const res = await request(app)
      .post('/api/comunicacao/emails')
      .set(authHeaders(tokenC1))
      .send({ assunto: 'Teste', corpo: 'Corpo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/destinatario_email/i);
  });

  it('POST /api/comunicacao/emails retorna 400 sem assunto', async () => {
    const res = await request(app)
      .post('/api/comunicacao/emails')
      .set(authHeaders(tokenC1))
      .send({ destinatario_email: 'dest@teste.com', corpo: 'Corpo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/assunto/i);
  });

  it('POST /api/comunicacao/emails envia email e retorna status enviado', async () => {
    const res = await request(app)
      .post('/api/comunicacao/emails')
      .set(authHeaders(tokenC1))
      .send({
        destinatario_email: 'contato@empresa.com',
        assunto: 'Proposta comercial',
        corpo: 'Olá, segue nossa proposta...',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('enviado');
    expect(res.body.data_envio).not.toBeNull();
    expect(res.body.destinatario_email).toBe('contato@empresa.com');
    emailIdC1 = res.body.id;
  });

  it('GET /api/comunicacao/emails lista o email criado', async () => {
    const res = await request(app)
      .get('/api/comunicacao/emails')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(emailIdC1);
  });

  it('GET /api/comunicacao/emails/:id retorna email específico', async () => {
    const res = await request(app)
      .get(`/api/comunicacao/emails/${emailIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(emailIdC1);
    expect(res.body.assunto).toBe('Proposta comercial');
    expect(res.body.remetente).toBeDefined();
  });

  it('GET /api/comunicacao/emails/:id retorna 404 para ID inexistente', async () => {
    const res = await request(app)
      .get('/api/comunicacao/emails/00000000-0000-0000-0000-000000000000')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(404);
  });

  it('GET /api/comunicacao/emails?status=enviado filtra por status', async () => {
    const res = await request(app)
      .get('/api/comunicacao/emails?status=enviado')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.every((e: any) => e.status === 'enviado')).toBe(true);
  });

  it('GET /api/comunicacao/emails?tipo=enviado filtra por tipo', async () => {
    const res = await request(app)
      .get('/api/comunicacao/emails?tipo=enviado')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.every((e: any) => e.tipo === 'enviado')).toBe(true);
  });
});

// ── Email multi-tenant ────────────────────────────────────────────────────────

describe('Email - Isolamento multi-tenant', () => {
  it('C2 não vê emails de C1', async () => {
    const res = await request(app)
      .get('/api/comunicacao/emails')
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(200);
    const ids = res.body.map((e: any) => e.id);
    expect(ids).not.toContain(emailIdC1);
  });

  it('C2 não acessa email de C1 por ID', async () => {
    const res = await request(app)
      .get(`/api/comunicacao/emails/${emailIdC1}`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(404);
  });

  it('C2 não deleta email de C1', async () => {
    const res = await request(app)
      .delete(`/api/comunicacao/emails/${emailIdC1}`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(404);
  });
});

// ── SMS CRUD ──────────────────────────────────────────────────────────────────

describe('SMS - CRUD', () => {
  it('GET /api/comunicacao/sms retorna lista vazia inicialmente', async () => {
    const res = await request(app)
      .get('/api/comunicacao/sms')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('POST /api/comunicacao/sms retorna 400 sem numero_destino', async () => {
    const res = await request(app)
      .post('/api/comunicacao/sms')
      .set(authHeaders(tokenC1))
      .send({ mensagem: 'Olá!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/numero_destino/i);
  });

  it('POST /api/comunicacao/sms retorna 400 sem mensagem', async () => {
    const res = await request(app)
      .post('/api/comunicacao/sms')
      .set(authHeaders(tokenC1))
      .send({ numero_destino: '+5511999999999' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/mensagem/i);
  });

  it('POST /api/comunicacao/sms envia SMS e retorna status enviado', async () => {
    const res = await request(app)
      .post('/api/comunicacao/sms')
      .set(authHeaders(tokenC1))
      .send({
        numero_destino: '+5511999999999',
        mensagem: 'Sua proposta foi enviada. Aguarde nosso contato!',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('enviado');
    expect(res.body.data_envio).not.toBeNull();
    expect(res.body.numero_destino).toBe('+5511999999999');
    smsIdC1 = res.body.id;
  });

  it('GET /api/comunicacao/sms lista o SMS criado', async () => {
    const res = await request(app)
      .get('/api/comunicacao/sms')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(smsIdC1);
  });

  it('GET /api/comunicacao/sms/:id retorna SMS específico', async () => {
    const res = await request(app)
      .get(`/api/comunicacao/sms/${smsIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(smsIdC1);
    expect(res.body.mensagem).toBe('Sua proposta foi enviada. Aguarde nosso contato!');
    expect(res.body.remetente).toBeDefined();
  });

  it('GET /api/comunicacao/sms/:id retorna 404 para ID inexistente', async () => {
    const res = await request(app)
      .get('/api/comunicacao/sms/00000000-0000-0000-0000-000000000000')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(404);
  });

  it('GET /api/comunicacao/sms?status=enviado filtra por status', async () => {
    const res = await request(app)
      .get('/api/comunicacao/sms?status=enviado')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.every((s: any) => s.status === 'enviado')).toBe(true);
  });
});

// ── SMS multi-tenant ──────────────────────────────────────────────────────────

describe('SMS - Isolamento multi-tenant', () => {
  it('C2 não vê SMS de C1', async () => {
    const res = await request(app)
      .get('/api/comunicacao/sms')
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(200);
    const ids = res.body.map((s: any) => s.id);
    expect(ids).not.toContain(smsIdC1);
  });

  it('C2 não acessa SMS de C1 por ID', async () => {
    const res = await request(app)
      .get(`/api/comunicacao/sms/${smsIdC1}`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(404);
  });
});

// ── Deletar ───────────────────────────────────────────────────────────────────

describe('Comunicação - Deletar', () => {
  it('DELETE /api/comunicacao/emails/:id deleta email com sucesso', async () => {
    const res = await request(app)
      .delete(`/api/comunicacao/emails/${emailIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/comunicacao/emails/:id retorna 404 após deletar', async () => {
    const res = await request(app)
      .get(`/api/comunicacao/emails/${emailIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(404);
  });

  it('DELETE /api/comunicacao/sms/:id deleta SMS com sucesso', async () => {
    const res = await request(app)
      .delete(`/api/comunicacao/sms/${smsIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
