'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

let tokenC1, tokenC2;
let tarefaIdC1, eventoIdC1;

beforeAll(async () => {
  await sequelize.query(`DELETE FROM calendario_eventos WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM tarefas WHERE cliente_id IN (1,2)`);

  [tokenC1, tokenC2] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ADMIN_C2.email, CREDENTIALS.ADMIN_C2.senha),
  ]);
});

afterAll(async () => {
  await sequelize.query(`DELETE FROM calendario_eventos WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM tarefas WHERE cliente_id IN (1,2)`);
});

// ── Auth guards ───────────────────────────────────────────────────────────────

describe('Auth - Tarefas endpoints requerem autenticação', () => {
  it('GET /api/tarefas retorna 401 sem token', async () => {
    const res = await request(app).get('/api/tarefas');
    expect(res.status).toBe(401);
  });

  it('POST /api/tarefas retorna 401 sem token', async () => {
    const res = await request(app).post('/api/tarefas').send({ titulo: 'Test' });
    expect(res.status).toBe(401);
  });

  it('GET /api/tarefas/metricas retorna 401 sem token', async () => {
    const res = await request(app).get('/api/tarefas/metricas');
    expect(res.status).toBe(401);
  });

  it('GET /api/tarefas/calendario/eventos retorna 401 sem token', async () => {
    const res = await request(app).get('/api/tarefas/calendario/eventos');
    expect(res.status).toBe(401);
  });
});

// ── Tarefas CRUD ──────────────────────────────────────────────────────────────

describe('Tarefas - CRUD', () => {
  it('GET /api/tarefas retorna lista vazia inicialmente', async () => {
    const res = await request(app)
      .get('/api/tarefas')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('POST /api/tarefas retorna 400 sem título', async () => {
    const res = await request(app)
      .post('/api/tarefas')
      .set(authHeaders(tokenC1))
      .send({ descricao: 'Sem título' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('POST /api/tarefas cria tarefa com sucesso', async () => {
    const res = await request(app)
      .post('/api/tarefas')
      .set(authHeaders(tokenC1))
      .send({
        titulo: 'Tarefa de teste',
        descricao: 'Descrição da tarefa',
        prioridade: 'alta',
        data_vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.titulo).toBe('Tarefa de teste');
    expect(res.body.status).toBe('todo');
    expect(res.body.prioridade).toBe('alta');
    tarefaIdC1 = res.body.id;
  });

  it('GET /api/tarefas retorna a tarefa criada', async () => {
    const res = await request(app)
      .get('/api/tarefas')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(tarefaIdC1);
  });

  it('GET /api/tarefas/:id retorna tarefa específica', async () => {
    const res = await request(app)
      .get(`/api/tarefas/${tarefaIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(tarefaIdC1);
    expect(res.body.usuarioCriador).toBeDefined();
    expect(Array.isArray(res.body.eventos)).toBe(true);
  });

  it('PUT /api/tarefas/:id atualiza tarefa', async () => {
    const res = await request(app)
      .put(`/api/tarefas/${tarefaIdC1}`)
      .set(authHeaders(tokenC1))
      .send({ titulo: 'Tarefa atualizada', prioridade: 'critica' });
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe('Tarefa atualizada');
    expect(res.body.prioridade).toBe('critica');
  });

  it('GET /api/tarefas?status=todo filtra por status', async () => {
    const res = await request(app)
      .get('/api/tarefas?status=todo')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.every((t: any) => t.status === 'todo')).toBe(true);
  });
});

// ── Status ────────────────────────────────────────────────────────────────────

describe('Tarefas - Mudança de status', () => {
  it('POST /api/tarefas/:id/status retorna 400 sem status', async () => {
    const res = await request(app)
      .post(`/api/tarefas/${tarefaIdC1}/status`)
      .set(authHeaders(tokenC1))
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/tarefas/:id/status muda para em_progresso e seta data_inicio', async () => {
    const res = await request(app)
      .post(`/api/tarefas/${tarefaIdC1}/status`)
      .set(authHeaders(tokenC1))
      .send({ status: 'em_progresso' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_progresso');
    expect(res.body.data_inicio).not.toBeNull();
  });

  it('POST /api/tarefas/:id/status muda para concluida e seta data_conclusao', async () => {
    const res = await request(app)
      .post(`/api/tarefas/${tarefaIdC1}/status`)
      .set(authHeaders(tokenC1))
      .send({ status: 'concluida' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('concluida');
    expect(res.body.data_conclusao).not.toBeNull();
  });

  it('POST /api/tarefas/:id/status retorna 404 para tarefa inexistente', async () => {
    const res = await request(app)
      .post('/api/tarefas/00000000-0000-0000-0000-000000000000/status')
      .set(authHeaders(tokenC1))
      .send({ status: 'todo' });
    expect(res.status).toBe(404);
  });
});

// ── Atribuição ────────────────────────────────────────────────────────────────

describe('Tarefas - Atribuição', () => {
  it('POST /api/tarefas/:id/atribuir retorna 400 sem usuario_id', async () => {
    const res = await request(app)
      .post(`/api/tarefas/${tarefaIdC1}/atribuir`)
      .set(authHeaders(tokenC1))
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/tarefas/:id/atribuir atribui tarefa a usuário', async () => {
    const res = await request(app)
      .post(`/api/tarefas/${tarefaIdC1}/atribuir`)
      .set(authHeaders(tokenC1))
      .send({ usuario_id: 1 });
    expect(res.status).toBe(200);
  });
});

// ── Métricas ──────────────────────────────────────────────────────────────────

describe('Tarefas - Métricas', () => {
  it('GET /api/tarefas/metricas retorna objeto de métricas', async () => {
    const res = await request(app)
      .get('/api/tarefas/metricas')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.total).toBeDefined();
    expect(res.body.concluidas).toBeDefined();
    expect(res.body.emProgresso).toBeDefined();
    expect(res.body.vencidas).toBeDefined();
    expect(res.body.taxaConclusao).toBeDefined();
  });

  it('métricas refletem tarefas do cliente C1 (1 concluída)', async () => {
    const res = await request(app)
      .get('/api/tarefas/metricas')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.concluidas).toBeGreaterThanOrEqual(1);
    expect(Number(res.body.taxaConclusao)).toBeGreaterThan(0);
  });

  it('métricas C2 são independentes de C1', async () => {
    const res = await request(app)
      .get('/api/tarefas/metricas')
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });
});

// ── Isolamento multi-tenant ───────────────────────────────────────────────────

describe('Tarefas - Isolamento multi-tenant', () => {
  it('C2 não vê tarefas de C1', async () => {
    const res = await request(app)
      .get('/api/tarefas')
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(200);
    const ids = res.body.map((t: any) => t.id);
    expect(ids).not.toContain(tarefaIdC1);
  });

  it('C2 não acessa tarefa de C1 por id', async () => {
    const res = await request(app)
      .get(`/api/tarefas/${tarefaIdC1}`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(404);
  });

  it('C2 não muda status de tarefa de C1', async () => {
    const res = await request(app)
      .post(`/api/tarefas/${tarefaIdC1}/status`)
      .set(authHeaders(tokenC2))
      .send({ status: 'todo' });
    expect(res.status).toBe(404);
  });
});

// ── Calendário - CRUD ─────────────────────────────────────────────────────────

describe('Calendário - CRUD', () => {
  it('GET /api/tarefas/calendario/eventos retorna lista vazia', async () => {
    const res = await request(app)
      .get('/api/tarefas/calendario/eventos')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/tarefas/calendario/eventos retorna 400 sem título', async () => {
    const res = await request(app)
      .post('/api/tarefas/calendario/eventos')
      .set(authHeaders(tokenC1))
      .send({ data_inicio: new Date().toISOString() });
    expect(res.status).toBe(400);
  });

  it('POST /api/tarefas/calendario/eventos retorna 400 sem data_inicio', async () => {
    const res = await request(app)
      .post('/api/tarefas/calendario/eventos')
      .set(authHeaders(tokenC1))
      .send({ titulo: 'Reunião' });
    expect(res.status).toBe(400);
  });

  it('POST /api/tarefas/calendario/eventos cria evento com sucesso', async () => {
    const dataInicio = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res = await request(app)
      .post('/api/tarefas/calendario/eventos')
      .set(authHeaders(tokenC1))
      .send({
        titulo: 'Reunião de alinhamento',
        data_inicio: dataInicio.toISOString(),
        tipo: 'reuniao',
        cor: '#3B82F6',
        local: 'Sala de reuniões',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.titulo).toBe('Reunião de alinhamento');
    expect(res.body.tipo).toBe('reuniao');
    expect(res.body.usuario).toBeDefined();
    eventoIdC1 = res.body.id;
  });

  it('GET /api/tarefas/calendario/eventos/:id retorna evento', async () => {
    const res = await request(app)
      .get(`/api/tarefas/calendario/eventos/${eventoIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(eventoIdC1);
  });

  it('PUT /api/tarefas/calendario/eventos/:id atualiza evento', async () => {
    const res = await request(app)
      .put(`/api/tarefas/calendario/eventos/${eventoIdC1}`)
      .set(authHeaders(tokenC1))
      .send({ titulo: 'Reunião atualizada', notificacao: '30min' });
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe('Reunião atualizada');
    expect(res.body.notificacao).toBe('30min');
  });

  it('GET /api/tarefas/calendario/eventos filtra por mes/ano', async () => {
    const agora = new Date();
    const res = await request(app)
      .get(`/api/tarefas/calendario/eventos?mes=${agora.getMonth() + 2}&ano=${agora.getFullYear()}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── Calendário - Próximos eventos ────────────────────────────────────────────

describe('Calendário - Próximos eventos', () => {
  it('GET /api/tarefas/calendario/proximos retorna eventos futuros', async () => {
    const res = await request(app)
      .get('/api/tarefas/calendario/proximos')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/tarefas/calendario/proximos?dias=1 respeita o limite de dias', async () => {
    const res = await request(app)
      .get('/api/tarefas/calendario/proximos?dias=1')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('C2 não vê próximos eventos de C1', async () => {
    const res = await request(app)
      .get('/api/tarefas/calendario/proximos')
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(200);
    const ids = res.body.map((e: any) => e.id);
    expect(ids).not.toContain(eventoIdC1);
  });
});

// ── Deletar ───────────────────────────────────────────────────────────────────

describe('Tarefas/Calendário - Deletar', () => {
  it('DELETE /api/tarefas/calendario/eventos/:id deleta evento', async () => {
    const res = await request(app)
      .delete(`/api/tarefas/calendario/eventos/${eventoIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/tarefas/:id C2 não deleta tarefa de C1', async () => {
    const res = await request(app)
      .delete(`/api/tarefas/${tarefaIdC1}`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(404);
  });

  it('DELETE /api/tarefas/:id deleta tarefa com sucesso', async () => {
    const res = await request(app)
      .delete(`/api/tarefas/${tarefaIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/tarefas/:id retorna 404 após deleção', async () => {
    const res = await request(app)
      .get(`/api/tarefas/${tarefaIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(404);
  });
});
