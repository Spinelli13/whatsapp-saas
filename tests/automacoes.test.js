'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

let tokenC1, tokenC2;
let workflowIdC1, workflowIdC2, triggerIdC1, acaoIdC1;

beforeAll(async () => {
  await sequelize.query(`DELETE FROM execucoes_workflow WHERE cliente_id IN (1,2)`);
  await sequelize.query(
    `DELETE FROM acoes_automacao WHERE workflow_id IN (SELECT id FROM workflows WHERE cliente_id IN (1,2))`
  );
  await sequelize.query(
    `DELETE FROM triggers WHERE workflow_id IN (SELECT id FROM workflows WHERE cliente_id IN (1,2))`
  );
  await sequelize.query(`DELETE FROM workflows WHERE cliente_id IN (1,2)`);

  [tokenC1, tokenC2] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ADMIN_C2.email, CREDENTIALS.ADMIN_C2.senha),
  ]);
});

afterAll(async () => {
  await sequelize.query(`DELETE FROM execucoes_workflow WHERE cliente_id IN (1,2)`);
  await sequelize.query(
    `DELETE FROM acoes_automacao WHERE workflow_id IN (SELECT id FROM workflows WHERE cliente_id IN (1,2))`
  );
  await sequelize.query(
    `DELETE FROM triggers WHERE workflow_id IN (SELECT id FROM workflows WHERE cliente_id IN (1,2))`
  );
  await sequelize.query(`DELETE FROM workflows WHERE cliente_id IN (1,2)`);
});

// ── Auth guards ────────────────────────────────────────────────────────────────

describe('Auth - Automações endpoints requerem autenticação', () => {
  it('GET /api/automacoes/workflows retorna 401 sem token', async () => {
    const res = await request(app).get('/api/automacoes/workflows');
    expect(res.status).toBe(401);
  });

  it('POST /api/automacoes/workflows retorna 401 sem token', async () => {
    const res = await request(app).post('/api/automacoes/workflows').send({ nome: 'Teste' });
    expect(res.status).toBe(401);
  });

  it('GET /api/automacoes/workflows/stats/dashboard retorna 401 sem token', async () => {
    const res = await request(app).get('/api/automacoes/workflows/stats/dashboard');
    expect(res.status).toBe(401);
  });

  it('DELETE /api/automacoes/workflows/:id retorna 401 sem token', async () => {
    const res = await request(app).delete('/api/automacoes/workflows/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(401);
  });
});

// ── Workflow CRUD ──────────────────────────────────────────────────────────────

describe('Workflow - CRUD', () => {
  it('GET /api/automacoes/workflows retorna lista vazia inicialmente', async () => {
    const res = await request(app)
      .get('/api/automacoes/workflows')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('POST /api/automacoes/workflows retorna 400 sem nome', async () => {
    const res = await request(app)
      .post('/api/automacoes/workflows')
      .set(authHeaders(tokenC1))
      .send({ tipo: 'trigger_manual' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nome/i);
  });

  it('POST /api/automacoes/workflows retorna 400 sem tipo', async () => {
    const res = await request(app)
      .post('/api/automacoes/workflows')
      .set(authHeaders(tokenC1))
      .send({ nome: 'Workflow Teste' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tipo/i);
  });

  it('POST /api/automacoes/workflows cria workflow com sucesso', async () => {
    const res = await request(app)
      .post('/api/automacoes/workflows')
      .set(authHeaders(tokenC1))
      .send({
        nome: 'Notificar ao ganhar oportunidade',
        descricao: 'Envia email quando oportunidade é ganha',
        tipo: 'trigger_evento',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.nome).toBe('Notificar ao ganhar oportunidade');
    expect(res.body.status).toBe('ativo');
    expect(res.body.tipo).toBe('trigger_evento');
    expect(Array.isArray(res.body.triggers)).toBe(true);
    expect(Array.isArray(res.body.acoes)).toBe(true);
    workflowIdC1 = res.body.id;
  });

  it('GET /api/automacoes/workflows lista o workflow criado', async () => {
    const res = await request(app)
      .get('/api/automacoes/workflows')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(workflowIdC1);
  });

  it('GET /api/automacoes/workflows?status=ativo filtra por status', async () => {
    const res = await request(app)
      .get('/api/automacoes/workflows?status=ativo')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.every((w) => w.status === 'ativo')).toBe(true);
  });

  it('GET /api/automacoes/workflows?tipo=trigger_evento filtra por tipo', async () => {
    const res = await request(app)
      .get('/api/automacoes/workflows?tipo=trigger_evento')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.every((w) => w.tipo === 'trigger_evento')).toBe(true);
  });

  it('GET /api/automacoes/workflows/:id retorna workflow específico', async () => {
    const res = await request(app)
      .get(`/api/automacoes/workflows/${workflowIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(workflowIdC1);
    expect(res.body.nome).toBe('Notificar ao ganhar oportunidade');
    expect(Array.isArray(res.body.triggers)).toBe(true);
    expect(Array.isArray(res.body.acoes)).toBe(true);
  });

  it('GET /api/automacoes/workflows/:id retorna 404 para ID inexistente', async () => {
    const res = await request(app)
      .get('/api/automacoes/workflows/00000000-0000-0000-0000-000000000000')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(404);
  });

  it('PUT /api/automacoes/workflows/:id atualiza workflow', async () => {
    const res = await request(app)
      .put(`/api/automacoes/workflows/${workflowIdC1}`)
      .set(authHeaders(tokenC1))
      .send({ nome: 'Workflow Atualizado', descricao: 'Nova descrição' });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Workflow Atualizado');
    expect(res.body.descricao).toBe('Nova descrição');
  });
});

// ── Workflow Status ────────────────────────────────────────────────────────────

describe('Workflow - Alteração de Status', () => {
  it('POST /:id/status muda para inativo', async () => {
    const res = await request(app)
      .post(`/api/automacoes/workflows/${workflowIdC1}/status`)
      .set(authHeaders(tokenC1))
      .send({ status: 'inativo' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('inativo');
  });

  it('POST /:id/status muda para pausado', async () => {
    const res = await request(app)
      .post(`/api/automacoes/workflows/${workflowIdC1}/status`)
      .set(authHeaders(tokenC1))
      .send({ status: 'pausado' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pausado');
  });

  it('POST /:id/status volta para ativo', async () => {
    const res = await request(app)
      .post(`/api/automacoes/workflows/${workflowIdC1}/status`)
      .set(authHeaders(tokenC1))
      .send({ status: 'ativo' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ativo');
  });

  it('POST /:id/status retorna 400 para status inválido', async () => {
    const res = await request(app)
      .post(`/api/automacoes/workflows/${workflowIdC1}/status`)
      .set(authHeaders(tokenC1))
      .send({ status: 'rodando' });
    expect(res.status).toBe(400);
  });
});

// ── Stats Dashboard ────────────────────────────────────────────────────────────

describe('Workflow - Estatísticas', () => {
  it('GET /stats/dashboard retorna 200', async () => {
    const res = await request(app)
      .get('/api/automacoes/workflows/stats/dashboard')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
  });

  it('stats tem campo total', async () => {
    const res = await request(app)
      .get('/api/automacoes/workflows/stats/dashboard')
      .set(authHeaders(tokenC1));
    expect(typeof res.body.total).toBe('number');
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('stats tem campo ativos', async () => {
    const res = await request(app)
      .get('/api/automacoes/workflows/stats/dashboard')
      .set(authHeaders(tokenC1));
    expect(typeof res.body.ativos).toBe('number');
    expect(res.body.ativos).toBeGreaterThanOrEqual(1);
  });

  it('stats tem taxaSucesso', async () => {
    const res = await request(app)
      .get('/api/automacoes/workflows/stats/dashboard')
      .set(authHeaders(tokenC1));
    expect(res.body.taxaSucesso).toBeDefined();
    expect(typeof res.body.taxaSucesso).toBe('number');
  });
});

// ── Multi-tenant ───────────────────────────────────────────────────────────────

describe('Workflow - Isolamento multi-tenant', () => {
  beforeAll(async () => {
    const res = await request(app)
      .post('/api/automacoes/workflows')
      .set(authHeaders(tokenC2))
      .send({ nome: 'Workflow C2', tipo: 'trigger_manual' });
    workflowIdC2 = res.body.id;
  });

  it('C2 não vê workflows de C1', async () => {
    const res = await request(app)
      .get('/api/automacoes/workflows')
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(200);
    const ids = res.body.map((w) => w.id);
    expect(ids).not.toContain(workflowIdC1);
    expect(ids).toContain(workflowIdC2);
  });

  it('C2 não acessa workflow de C1 por ID', async () => {
    const res = await request(app)
      .get(`/api/automacoes/workflows/${workflowIdC1}`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(404);
  });

  it('C2 não deleta workflow de C1', async () => {
    const res = await request(app)
      .delete(`/api/automacoes/workflows/${workflowIdC1}`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(404);

    // Confirma que o workflow de C1 ainda existe
    const check = await request(app)
      .get(`/api/automacoes/workflows/${workflowIdC1}`)
      .set(authHeaders(tokenC1));
    expect(check.status).toBe(200);
  });
});

// ── Triggers ──────────────────────────────────────────────────────────────────

describe('Trigger - CRUD', () => {
  it('POST /workflows/:id/triggers retorna 400 sem tipo', async () => {
    const res = await request(app)
      .post(`/api/automacoes/workflows/${workflowIdC1}/triggers`)
      .set(authHeaders(tokenC1))
      .send({ condicoes: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tipo/i);
  });

  it('POST /workflows/:id/triggers cria trigger com sucesso', async () => {
    const res = await request(app)
      .post(`/api/automacoes/workflows/${workflowIdC1}/triggers`)
      .set(authHeaders(tokenC1))
      .send({ tipo: 'oportunidade_ganha', condicoes: { valor_minimo: 1000 } });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.tipo).toBe('oportunidade_ganha');
    expect(res.body.workflow_id).toBe(workflowIdC1);
    triggerIdC1 = res.body.id;
  });

  it('C2 não cria trigger no workflow de C1', async () => {
    const res = await request(app)
      .post(`/api/automacoes/workflows/${workflowIdC1}/triggers`)
      .set(authHeaders(tokenC2))
      .send({ tipo: 'tarefa_criada' });
    expect(res.status).toBe(404);
  });

  it('PUT /triggers/:id atualiza trigger', async () => {
    const res = await request(app)
      .put(`/api/automacoes/triggers/${triggerIdC1}`)
      .set(authHeaders(tokenC1))
      .send({ condicoes: { valor_minimo: 5000 } });
    expect(res.status).toBe(200);
    expect(res.body.condicoes.valor_minimo).toBe(5000);
  });

  it('workflow obter inclui o trigger criado', async () => {
    const res = await request(app)
      .get(`/api/automacoes/workflows/${workflowIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    const ids = res.body.triggers.map((t) => t.id);
    expect(ids).toContain(triggerIdC1);
  });
});

// ── Ações ──────────────────────────────────────────────────────────────────────

describe('Ação - CRUD', () => {
  it('POST /workflows/:id/acoes retorna 400 sem tipo', async () => {
    const res = await request(app)
      .post(`/api/automacoes/workflows/${workflowIdC1}/acoes`)
      .set(authHeaders(tokenC1))
      .send({ sequencia: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tipo/i);
  });

  it('POST /workflows/:id/acoes retorna 400 sem sequência', async () => {
    const res = await request(app)
      .post(`/api/automacoes/workflows/${workflowIdC1}/acoes`)
      .set(authHeaders(tokenC1))
      .send({ tipo: 'enviar_email' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/sequência|sequencia/i);
  });

  it('POST /workflows/:id/acoes cria ação com sucesso', async () => {
    const res = await request(app)
      .post(`/api/automacoes/workflows/${workflowIdC1}/acoes`)
      .set(authHeaders(tokenC1))
      .send({
        tipo: 'enviar_email',
        sequencia: 1,
        parametros: { assunto: 'Parabéns! Oportunidade ganha!' },
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.tipo).toBe('enviar_email');
    expect(res.body.sequencia).toBe(1);
    expect(res.body.workflow_id).toBe(workflowIdC1);
    acaoIdC1 = res.body.id;
  });

  it('C2 não cria ação no workflow de C1', async () => {
    const res = await request(app)
      .post(`/api/automacoes/workflows/${workflowIdC1}/acoes`)
      .set(authHeaders(tokenC2))
      .send({ tipo: 'criar_tarefa', sequencia: 1 });
    expect(res.status).toBe(404);
  });

  it('PUT /acoes/:id atualiza ação', async () => {
    const res = await request(app)
      .put(`/api/automacoes/acoes/${acaoIdC1}`)
      .set(authHeaders(tokenC1))
      .send({ parametros: { assunto: 'Atualizado', destinatario: 'cliente@empresa.com' } });
    expect(res.status).toBe(200);
    expect(res.body.parametros.assunto).toBe('Atualizado');
  });

  it('workflow obter inclui a ação criada', async () => {
    const res = await request(app)
      .get(`/api/automacoes/workflows/${workflowIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    const ids = res.body.acoes.map((a) => a.id);
    expect(ids).toContain(acaoIdC1);
  });
});

// ── Deletar ───────────────────────────────────────────────────────────────────

describe('Automações - Deletar', () => {
  it('DELETE /triggers/:id deleta trigger com sucesso', async () => {
    const res = await request(app)
      .delete(`/api/automacoes/triggers/${triggerIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /acoes/:id deleta ação com sucesso', async () => {
    const res = await request(app)
      .delete(`/api/automacoes/acoes/${acaoIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /workflows/:id deleta workflow com sucesso', async () => {
    const res = await request(app)
      .delete(`/api/automacoes/workflows/${workflowIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET retorna 404 após deletar workflow', async () => {
    const res = await request(app)
      .get(`/api/automacoes/workflows/${workflowIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(404);
  });
});
