'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

const FAKE_UUID = '00000000-0000-4000-8000-000000000099';

let tokenAdmin, tokenAtendente;
let configId, skillId;

beforeAll(async () => {
  await sequelize.query(`DELETE FROM configuracoes_roteamento WHERE cliente_id = 1`);
  await sequelize.query(`DELETE FROM skills_atendentes WHERE nome_skill LIKE 'TESTE_%'`);

  [tokenAdmin, tokenAtendente] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email,     CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ATENDENTE_C1.email, CREDENTIALS.ATENDENTE_C1.senha),
  ]);
});

afterAll(async () => {
  await sequelize.query(`DELETE FROM configuracoes_roteamento WHERE cliente_id = 1`);
  await sequelize.query(`DELETE FROM skills_atendentes WHERE nome_skill LIKE 'TESTE_%'`);
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('Auth — Roteamento requer autenticação', () => {
  it('GET /api/roteamento/config retorna 401 sem token', async () => {
    const res = await request(app).get('/api/roteamento/config');
    expect(res.status).toBe(401);
  });

  it('POST /api/roteamento/config retorna 401 sem token', async () => {
    const res = await request(app).post('/api/roteamento/config').send({ tipo_roteamento: 'least_busy' });
    expect(res.status).toBe(401);
  });

  it('GET /api/roteamento/skills retorna 401 sem token', async () => {
    const res = await request(app).get('/api/roteamento/skills');
    expect(res.status).toBe(401);
  });
});

// ── CRUD Configurações ────────────────────────────────────────────────────────

describe('CRUD — Configurações de Roteamento', () => {
  it('GET /config lista configurações do cliente', async () => {
    const res = await request(app)
      .get('/api/roteamento/config')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /config cria configuração least_busy', async () => {
    const res = await request(app)
      .post('/api/roteamento/config')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tipo_roteamento: 'least_busy', limite_simultaneos: 15, tempo_sla_minutos: 10 });

    expect(res.status).toBe(201);
    expect(res.body.data.tipo_roteamento).toBe('least_busy');
    expect(res.body.data.limite_simultaneos).toBe(15);
    expect(res.body.data.tempo_sla_minutos).toBe(10);
    expect(res.body.data).toHaveProperty('id');
    configId = res.body.data.id;
  });

  it('POST /config cria configuração round_robin', async () => {
    const res = await request(app)
      .post('/api/roteamento/config')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ tipo_roteamento: 'round_robin', limite_simultaneos: 5, tempo_sla_minutos: 3 });

    expect(res.status).toBe(201);
    expect(res.body.data.tipo_roteamento).toBe('round_robin');
  });

  it('PUT /config/:id atualiza configuração', async () => {
    const res = await request(app)
      .put(`/api/roteamento/config/${configId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ limite_simultaneos: 20, ativo: false });

    expect(res.status).toBe(200);
    expect(res.body.data.limite_simultaneos).toBe(20);
    expect(res.body.data.ativo).toBe(false);
  });

  it('PUT /config/:id com UUID inexistente retorna 404', async () => {
    const res = await request(app)
      .put(`/api/roteamento/config/${FAKE_UUID}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ ativo: true });

    expect(res.status).toBe(404);
  });

  it('GET /config lista configurações atualizadas', async () => {
    const res = await request(app)
      .get('/api/roteamento/config')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    const encontrado = res.body.data.find((c) => c.id === configId);
    expect(encontrado).toBeDefined();
    expect(encontrado.limite_simultaneos).toBe(20);
  });
});

// ── Skills ────────────────────────────────────────────────────────────────────

describe('Skills — CRUD de Habilidades do Atendente', () => {
  it('GET /skills retorna lista vazia inicialmente', async () => {
    const res = await request(app)
      .get('/api/roteamento/skills')
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /skill adiciona skill com nível avançado', async () => {
    const res = await request(app)
      .post('/api/roteamento/skill')
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({ nome_skill: 'TESTE_Vendas', nivel: 'avancado' });

    expect(res.status).toBe(201);
    expect(res.body.data.nome_skill).toBe('TESTE_Vendas');
    expect(res.body.data.nivel).toBe('avancado');
    skillId = res.body.data.id;
  });

  it('POST /skill adiciona skill com nível padrão (basico)', async () => {
    const res = await request(app)
      .post('/api/roteamento/skill')
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({ nome_skill: 'TESTE_Suporte' });

    expect(res.status).toBe(201);
    expect(res.body.data.nivel).toBe('basico');
  });

  it('POST /skill sem nome retorna 400', async () => {
    const res = await request(app)
      .post('/api/roteamento/skill')
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({ nome_skill: '' });

    expect(res.status).toBe(400);
  });

  it('GET /skills lista skills cadastradas', async () => {
    const res = await request(app)
      .get('/api/roteamento/skills')
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(200);
    const encontrada = res.body.data.find((s) => s.id === skillId);
    expect(encontrada).toBeDefined();
    expect(encontrada.nome_skill).toBe('TESTE_Vendas');
  });

  it('DELETE /skill/:id remove skill', async () => {
    const res = await request(app)
      .delete(`/api/roteamento/skill/${skillId}`)
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
  });

  it('DELETE /skill/:id inexistente retorna 404', async () => {
    const res = await request(app)
      .delete(`/api/roteamento/skill/${FAKE_UUID}`)
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(404);
  });

  it('Admin também pode adicionar skills', async () => {
    const res = await request(app)
      .post('/api/roteamento/skill')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome_skill: 'TESTE_Admin_Financeiro', nivel: 'intermediario' });

    expect(res.status).toBe(201);
  });
});

// ── SLA ───────────────────────────────────────────────────────────────────────

describe('SLA — Verificação de prazo', () => {
  it('GET /sla/:id com UUID inexistente retorna 404', async () => {
    const res = await request(app)
      .get(`/api/roteamento/sla/${FAKE_UUID}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
  });
});

// ── Isolamento multi-tenant ───────────────────────────────────────────────────

describe('Isolamento — Configurações são isoladas por cliente', () => {
  it('Config criada pelo admin C1 não aparece para admin C2', async () => {
    const tokenAdmin2 = await loginUser('admin@barcos.com', 'password123');

    const res = await request(app)
      .get('/api/roteamento/config')
      .set('Authorization', `Bearer ${tokenAdmin2}`);

    expect(res.status).toBe(200);
    const encontrado = res.body.data.find((c) => c.id === configId);
    expect(encontrado).toBeUndefined();
  });
});
