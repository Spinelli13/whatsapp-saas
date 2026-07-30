'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

const FAKE_UUID = '00000000-0000-4000-8000-000000000099';

let tokenAdmin, tokenAtendente;
let fluxoId;

beforeAll(async () => {
  await sequelize.query(`DELETE FROM fluxos_bot WHERE nome LIKE 'TESTE_%'`);
  [tokenAdmin, tokenAtendente] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email,     CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ATENDENTE_C1.email, CREDENTIALS.ATENDENTE_C1.senha),
  ]);
});

afterAll(async () => {
  await sequelize.query(`DELETE FROM fluxos_bot WHERE nome LIKE 'TESTE_%'`);
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('Auth — Chatbot requer autenticação', () => {
  it('GET /api/chatbot/fluxos retorna 401 sem token', async () => {
    const res = await request(app).get('/api/chatbot/fluxos');
    expect(res.status).toBe(401);
  });

  it('POST /api/chatbot/fluxos retorna 401 sem token', async () => {
    const res = await request(app)
      .post('/api/chatbot/fluxos')
      .send({ nome: 'teste' });
    expect(res.status).toBe(401);
  });
});

// ── CRUD Fluxos ───────────────────────────────────────────────────────────────

describe('CRUD — Fluxos Bot', () => {
  it('POST /api/chatbot/fluxos cria novo fluxo', async () => {
    const res = await request(app)
      .post('/api/chatbot/fluxos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nome: 'TESTE_Fluxo Simples',
        mensagem_saudacao: 'Olá!',
        mensagem_despedida: 'Até logo!',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.nome).toBe('TESTE_Fluxo Simples');
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.ativo).toBe(false);
    fluxoId = res.body.data.id;
  });

  it('GET /api/chatbot/fluxos lista fluxos do cliente', async () => {
    const res = await request(app)
      .get('/api/chatbot/fluxos')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const encontrado = res.body.data.find((f) => f.id === fluxoId);
    expect(encontrado).toBeDefined();
  });

  it('GET /api/chatbot/fluxos/:id retorna fluxo completo', async () => {
    const res = await request(app)
      .get(`/api/chatbot/fluxos/${fluxoId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(fluxoId);
    expect(res.body.data).toHaveProperty('estrutura_json');
    expect(res.body.data.estrutura_json).toHaveProperty('nodes');
  });

  it('PUT /api/chatbot/fluxos/:id atualiza o fluxo', async () => {
    const novaEstrutura = {
      nodes: [{ id: '1', type: 'bloco', data: { tipo: 'inicio', conteudo: 'Bem-vindo!' }, position: { x: 0, y: 0 } }],
      edges: [],
    };

    const res = await request(app)
      .put(`/api/chatbot/fluxos/${fluxoId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome: 'TESTE_Fluxo Atualizado', estrutura_json: novaEstrutura });

    expect(res.status).toBe(200);
    expect(res.body.data.nome).toBe('TESTE_Fluxo Atualizado');
    expect(res.body.data.estrutura_json.nodes).toHaveLength(1);
  });

  it('PATCH /api/chatbot/fluxos/:id/ativar ativa o fluxo', async () => {
    const res = await request(app)
      .patch(`/api/chatbot/fluxos/${fluxoId}/ativar`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.ativo).toBe(true);
  });

  it('PATCH ativar desativa outros fluxos do cliente', async () => {
    // Cria um segundo fluxo e ativa ele
    const resCreate = await request(app)
      .post('/api/chatbot/fluxos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome: 'TESTE_Fluxo B' });

    const idB = resCreate.body.data.id;

    await request(app)
      .patch(`/api/chatbot/fluxos/${idB}/ativar`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    // O fluxo original deve ter sido desativado
    const resOriginal = await request(app)
      .get(`/api/chatbot/fluxos/${fluxoId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(resOriginal.body.data.ativo).toBe(false);
  });

  it('DELETE /api/chatbot/fluxos/:id remove o fluxo', async () => {
    const res = await request(app)
      .delete(`/api/chatbot/fluxos/${fluxoId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
  });

  it('GET retorna 404 após deletar', async () => {
    const res = await request(app)
      .get(`/api/chatbot/fluxos/${fluxoId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
  });
});

// ── Validações ────────────────────────────────────────────────────────────────

describe('Validações — Fluxos Bot', () => {
  it('POST sem nome retorna 400', async () => {
    const res = await request(app)
      .post('/api/chatbot/fluxos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome: '' });

    expect(res.status).toBe(400);
  });

  it('POST sem body retorna 400', async () => {
    const res = await request(app)
      .post('/api/chatbot/fluxos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('GET fluxo inexistente retorna 404', async () => {
    const res = await request(app)
      .get(`/api/chatbot/fluxos/${FAKE_UUID}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
  });
});

// ── Acesso de atendente ───────────────────────────────────────────────────────

describe('Acesso — Atendente pode listar e criar', () => {
  it('atendente pode GET /api/chatbot/fluxos', async () => {
    const res = await request(app)
      .get('/api/chatbot/fluxos')
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('atendente pode criar fluxo', async () => {
    const res = await request(app)
      .post('/api/chatbot/fluxos')
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({ nome: 'TESTE_Fluxo Atendente' });

    expect(res.status).toBe(201);
  });
});

// ── Testador de Fluxo ─────────────────────────────────────────────────────────

describe('Testador — POST /api/chatbot/testar', () => {
  it('executa fluxo com nó de início', async () => {
    const estrutura = {
      nodes: [
        { id: '1', type: 'bloco', data: { tipo: 'inicio', conteudo: 'Bem-vindo!' }, position: { x: 0, y: 0 } },
      ],
      edges: [],
    };

    const res = await request(app)
      .post('/api/chatbot/testar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estrutura_json: estrutura, resposta_usuario: 'Olá' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('passos');
    expect(Array.isArray(res.body.data.passos)).toBe(true);
    expect(res.body.data.passos.length).toBeGreaterThan(0);
  });

  it('fluxo com nó de transferência retorna resultado TRANSFERIR', async () => {
    const estrutura = {
      nodes: [
        { id: '1', type: 'bloco', data: { tipo: 'inicio', conteudo: 'Olá!' }, position: { x: 0, y: 0 } },
        { id: '2', type: 'bloco', data: { tipo: 'transferencia', conteudo: 'Transferindo...' }, position: { x: 0, y: 100 } },
      ],
      edges: [{ id: 'e1', source: '1', target: '2' }],
    };

    const res = await request(app)
      .post('/api/chatbot/testar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estrutura_json: estrutura, resposta_usuario: '' });

    expect(res.status).toBe(200);
    const passos = res.body.data.passos;
    const transferencia = passos.find((p) => p.resultado && p.resultado.includes('TRANSFERIR'));
    expect(transferencia).toBeDefined();
  });

  it('POST sem estrutura_json retorna 400', async () => {
    const res = await request(app)
      .post('/api/chatbot/testar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('fluxo vazio retorna passos com resultado "Fluxo vazio"', async () => {
    const res = await request(app)
      .post('/api/chatbot/testar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estrutura_json: { nodes: [], edges: [] } });

    expect(res.status).toBe(200);
    expect(res.body.data.passos[0].resultado).toBe('Fluxo vazio');
  });
});
