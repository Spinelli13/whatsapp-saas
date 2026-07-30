'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

const FAKE_UUID = '00000000-0000-4000-8000-000000000099';

let tokenAdmin, tokenAtendente;
let atendimentoId;
let notaId;

beforeAll(async () => {
  await sequelize.query(`
    DELETE FROM notas_internas
    WHERE atendimento_id IN (
      SELECT id FROM atendimentos WHERE numero_whatsapp LIKE '5585992%'
    )
  `);
  await sequelize.query(`DELETE FROM atendimentos WHERE numero_whatsapp LIKE '5585992%'`);

  [tokenAdmin, tokenAtendente] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email,     CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ATENDENTE_C1.email, CREDENTIALS.ATENDENTE_C1.senha),
  ]);

  // Cria um atendimento real para usar nos testes de notas
  const res = await request(app)
    .post('/api/atendimento/receber')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ numero: '5585992010001', mensagem: 'teste notas internas' });

  atendimentoId = res.body.atendimento?.id || res.body.id;
});

afterAll(async () => {
  await sequelize.query(`
    DELETE FROM notas_internas
    WHERE atendimento_id IN (
      SELECT id FROM atendimentos WHERE numero_whatsapp LIKE '5585992%'
    )
  `);
  await sequelize.query(`DELETE FROM atendimentos WHERE numero_whatsapp LIKE '5585992%'`);
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('Auth — Notas Internas requerem autenticação', () => {
  it('GET /api/atendimento/:id/notas retorna 401 sem token', async () => {
    const res = await request(app).get(`/api/atendimento/${FAKE_UUID}/notas`);
    expect(res.status).toBe(401);
  });

  it('POST /api/atendimento/:id/notas retorna 401 sem token', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${FAKE_UUID}/notas`)
      .send({ conteudo: 'teste' });
    expect(res.status).toBe(401);
  });

  it('DELETE /api/atendimento/nota/:id retorna 401 sem token', async () => {
    const res = await request(app).delete(`/api/atendimento/nota/${FAKE_UUID}`);
    expect(res.status).toBe(401);
  });
});

// ── CRUD básico ───────────────────────────────────────────────────────────────

describe('CRUD — Notas Internas', () => {
  it('POST cria nova nota no atendimento', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoId}/notas`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ conteudo: 'TESTE_Nota importante do admin' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.conteudo).toBe('TESTE_Nota importante do admin');
    expect(res.body.data.atendimento_id).toBe(atendimentoId);
    notaId = res.body.data.id;
  });

  it('GET lista notas do atendimento', async () => {
    const res = await request(app)
      .get(`/api/atendimento/${atendimentoId}/notas`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const encontrada = res.body.data.find((n) => n.id === notaId);
    expect(encontrada).toBeDefined();
    expect(encontrada.conteudo).toBe('TESTE_Nota importante do admin');
  });

  it('GET lista retorna autor com nome e email', async () => {
    const res = await request(app)
      .get(`/api/atendimento/${atendimentoId}/notas`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    const nota = res.body.data.find((n) => n.id === notaId);
    expect(nota.autor).toBeDefined();
    expect(nota.autor).toHaveProperty('nome');
    expect(nota.autor).toHaveProperty('email');
  });

  it('GET /api/atendimento/nota/:id retorna a nota específica', async () => {
    const res = await request(app)
      .get(`/api/atendimento/nota/${notaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(notaId);
    expect(res.body.data.conteudo).toBe('TESTE_Nota importante do admin');
  });

  it('DELETE remove nota do criador', async () => {
    const res = await request(app)
      .delete(`/api/atendimento/nota/${notaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
  });

  it('GET /api/atendimento/nota/:id retorna 404 após deletar', async () => {
    const res = await request(app)
      .get(`/api/atendimento/nota/${notaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
  });
});

// ── Validações ────────────────────────────────────────────────────────────────

describe('Validações — Notas Internas', () => {
  it('POST sem conteúdo retorna 400', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoId}/notas`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ conteudo: '' });

    expect(res.status).toBe(400);
  });

  it('POST sem body retorna 400', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoId}/notas`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('GET nota inexistente retorna 404', async () => {
    const res = await request(app)
      .get(`/api/atendimento/nota/${FAKE_UUID}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
  });

  it('DELETE nota inexistente retorna 404', async () => {
    const res = await request(app)
      .delete(`/api/atendimento/nota/${FAKE_UUID}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
  });
});

// ── Controle de acesso ────────────────────────────────────────────────────────

describe('Acesso — apenas o criador pode deletar', () => {
  let notaDoAdmin;

  beforeAll(async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoId}/notas`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ conteudo: 'TESTE_Nota exclusiva do admin' });

    notaDoAdmin = res.body.data?.id;
  });

  it('atendente pode listar notas', async () => {
    const res = await request(app)
      .get(`/api/atendimento/${atendimentoId}/notas`)
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('atendente pode criar nota', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoId}/notas`)
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({ conteudo: 'TESTE_Nota do atendente' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
  });

  it('atendente NÃO pode deletar nota do admin — retorna 403', async () => {
    if (!notaDoAdmin) return;

    const res = await request(app)
      .delete(`/api/atendimento/nota/${notaDoAdmin}`)
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(403);
  });
});

// ── Conteúdo trimado ──────────────────────────────────────────────────────────

describe('Conteúdo — formatação', () => {
  it('conteúdo com espaços em branco é salvo sem padding', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoId}/notas`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ conteudo: '  TESTE_Com espaços  ' });

    expect(res.status).toBe(201);
    expect(res.body.data.conteudo).toBe('TESTE_Com espaços');
  });
});
