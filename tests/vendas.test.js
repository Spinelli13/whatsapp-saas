'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS, CLIENTE_IDS } = require('./constants');

let tokenC1, tokenC2;
let estagioIdC1, estagioId2C1, oportunidadeIdC1;

beforeAll(async () => {
  await sequelize.query(`DELETE FROM historico_oportunidade WHERE oportunidade_id IN (SELECT id FROM oportunidades WHERE cliente_id IN (1,2))`);
  await sequelize.query(`DELETE FROM oportunidades WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM configuracao_pipeline WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM estagios_pipeline WHERE cliente_id IN (1,2)`);

  [tokenC1, tokenC2] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ADMIN_C2.email, CREDENTIALS.ADMIN_C2.senha),
  ]);
});

afterAll(async () => {
  await sequelize.query(`DELETE FROM historico_oportunidade WHERE oportunidade_id IN (SELECT id FROM oportunidades WHERE cliente_id IN (1,2))`);
  await sequelize.query(`DELETE FROM oportunidades WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM configuracao_pipeline WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM estagios_pipeline WHERE cliente_id IN (1,2)`);
});

// ── Auth guards ───────────────────────────────────────────────────────────────

describe('Auth - Vendas endpoints requerem autenticação', () => {
  it('GET /api/vendas/pipeline retorna 401 sem token', async () => {
    const res = await request(app).get('/api/vendas/pipeline');
    expect(res.status).toBe(401);
  });

  it('GET /api/vendas/pipeline/estagios retorna 401 sem token', async () => {
    const res = await request(app).get('/api/vendas/pipeline/estagios');
    expect(res.status).toBe(401);
  });

  it('POST /api/vendas/oportunidades retorna 401 sem token', async () => {
    const res = await request(app).post('/api/vendas/oportunidades').send({ titulo: 'Test' });
    expect(res.status).toBe(401);
  });

  it('GET /api/vendas/oportunidades retorna 401 sem token', async () => {
    const res = await request(app).get('/api/vendas/oportunidades');
    expect(res.status).toBe(401);
  });

  it('GET /api/vendas/metricas retorna 401 sem token', async () => {
    const res = await request(app).get('/api/vendas/metricas');
    expect(res.status).toBe(401);
  });
});

// ── Pipeline estágios ─────────────────────────────────────────────────────────

describe('Pipeline - Estágios CRUD', () => {
  it('GET /api/vendas/pipeline/estagios retorna lista vazia inicialmente', async () => {
    const res = await request(app)
      .get('/api/vendas/pipeline/estagios')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('POST /api/vendas/pipeline/estagios cria estágio com sucesso', async () => {
    const res = await request(app)
      .post('/api/vendas/pipeline/estagios')
      .set(authHeaders(tokenC1))
      .send({ nome: 'Prospecção', cor: '#3B82F6', descricao: 'Leads iniciais' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.nome).toBe('Prospecção');
    expect(res.body.cor).toBe('#3B82F6');
    expect(res.body.ordem).toBe(1);
    estagioIdC1 = res.body.id;
  });

  it('POST /api/vendas/pipeline/estagios cria segundo estágio com ordem incremental', async () => {
    const res = await request(app)
      .post('/api/vendas/pipeline/estagios')
      .set(authHeaders(tokenC1))
      .send({ nome: 'Negociação', cor: '#F59E0B' });
    expect(res.status).toBe(201);
    expect(res.body.ordem).toBe(2);
    estagioId2C1 = res.body.id;
  });

  it('GET /api/vendas/pipeline/estagios retorna estágios ordenados', async () => {
    const res = await request(app)
      .get('/api/vendas/pipeline/estagios')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].ordem).toBeLessThan(res.body[1].ordem);
  });

  it('PUT /api/vendas/pipeline/estagios/:id atualiza estágio', async () => {
    const res = await request(app)
      .put(`/api/vendas/pipeline/estagios/${estagioIdC1}`)
      .set(authHeaders(tokenC1))
      .send({ nome: 'Prospecção Qualificada', cor: '#10B981' });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Prospecção Qualificada');
  });

  it('PUT /api/vendas/pipeline/estagios/:id retorna 404 para estágio de outro cliente', async () => {
    const res = await request(app)
      .put(`/api/vendas/pipeline/estagios/${estagioIdC1}`)
      .set(authHeaders(tokenC2))
      .send({ nome: 'Hack attempt' });
    expect(res.status).toBe(404);
  });
});

// ── Oportunidades CRUD ────────────────────────────────────────────────────────

describe('Oportunidades - CRUD', () => {
  it('POST /api/vendas/oportunidades retorna 400 sem título', async () => {
    const res = await request(app)
      .post('/api/vendas/oportunidades')
      .set(authHeaders(tokenC1))
      .send({ valor: 5000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('POST /api/vendas/oportunidades cria oportunidade com dados válidos', async () => {
    const res = await request(app)
      .post('/api/vendas/oportunidades')
      .set(authHeaders(tokenC1))
      .send({
        titulo: 'Contrato Empresa ABC',
        valor: 15000,
        probabilidade: 70,
        estagio_id: estagioIdC1,
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.titulo).toBe('Contrato Empresa ABC');
    expect(parseFloat(res.body.valor)).toBe(15000);
    expect(res.body.status).toBe('aberta');
    expect(res.body.cliente_id).toBe(CLIENTE_IDS.C1);
    oportunidadeIdC1 = res.body.id;
  });

  it('POST /api/vendas/oportunidades adiciona cliente_id automaticamente', async () => {
    const res = await request(app)
      .post('/api/vendas/oportunidades')
      .set(authHeaders(tokenC1))
      .send({ titulo: 'Oportunidade 2', valor: 8000 });
    expect(res.status).toBe(201);
    expect(res.body.cliente_id).toBe(CLIENTE_IDS.C1);
  });

  it('GET /api/vendas/oportunidades lista oportunidades do cliente', async () => {
    const res = await request(app)
      .get('/api/vendas/oportunidades')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/vendas/oportunidades filtra por status', async () => {
    const res = await request(app)
      .get('/api/vendas/oportunidades?status=aberta')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    res.body.forEach((op) => expect(op.status).toBe('aberta'));
  });

  it('GET /api/vendas/oportunidades não retorna oportunidades de outro cliente', async () => {
    const res = await request(app)
      .get('/api/vendas/oportunidades')
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(200);
    res.body.forEach((op) => expect(op.cliente_id).toBe(CLIENTE_IDS.C2));
  });

  it('GET /api/vendas/oportunidades/:id retorna oportunidade com includes', async () => {
    const res = await request(app)
      .get(`/api/vendas/oportunidades/${oportunidadeIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(oportunidadeIdC1);
    expect(res.body.estagio).toBeDefined();
    expect(res.body.historico).toBeDefined();
    expect(Array.isArray(res.body.historico)).toBe(true);
  });

  it('GET /api/vendas/oportunidades/:id retorna 404 para ID inválido', async () => {
    const res = await request(app)
      .get('/api/vendas/oportunidades/00000000-0000-0000-0000-000000000000')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(404);
  });

  it('GET /api/vendas/oportunidades/:id retorna 404 para oportunidade de outro cliente', async () => {
    const res = await request(app)
      .get(`/api/vendas/oportunidades/${oportunidadeIdC1}`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(404);
  });

  it('PUT /api/vendas/oportunidades/:id atualiza oportunidade', async () => {
    const res = await request(app)
      .put(`/api/vendas/oportunidades/${oportunidadeIdC1}`)
      .set(authHeaders(tokenC1))
      .send({ titulo: 'Contrato Empresa ABC - Revisado', probabilidade: 85 });
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe('Contrato Empresa ABC - Revisado');
  });

  it('PUT /api/vendas/oportunidades/:id retorna 404 para oportunidade de outro cliente', async () => {
    const res = await request(app)
      .put(`/api/vendas/oportunidades/${oportunidadeIdC1}`)
      .set(authHeaders(tokenC2))
      .send({ titulo: 'Hack' });
    expect(res.status).toBe(404);
  });
});

// ── Mover entre estágios ──────────────────────────────────────────────────────

describe('Oportunidades - Mover entre estágios', () => {
  it('POST /api/vendas/oportunidades/:id/mover retorna 400 sem estagio_id', async () => {
    const res = await request(app)
      .post(`/api/vendas/oportunidades/${oportunidadeIdC1}/mover`)
      .set(authHeaders(tokenC1))
      .send({ posicao: 0 });
    expect(res.status).toBe(400);
  });

  it('POST /api/vendas/oportunidades/:id/mover move para novo estágio', async () => {
    const res = await request(app)
      .post(`/api/vendas/oportunidades/${oportunidadeIdC1}/mover`)
      .set(authHeaders(tokenC1))
      .send({ estagio_id: estagioId2C1, posicao: 0 });
    expect(res.status).toBe(200);
    expect(res.body.estagio_id).toBe(estagioId2C1);
  });

  it('POST /api/vendas/oportunidades/:id/mover registra histórico', async () => {
    const res = await request(app)
      .get(`/api/vendas/oportunidades/${oportunidadeIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    const movimentos = res.body.historico.filter((h) => h.acao === 'movida');
    expect(movimentos.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/vendas/oportunidades/:id/mover retorna 404 para estágio de outro cliente', async () => {
    const resEstagio = await request(app)
      .post('/api/vendas/pipeline/estagios')
      .set(authHeaders(tokenC2))
      .send({ nome: 'Estágio C2', cor: '#EF4444' });
    const estagioC2 = resEstagio.body.id;

    const res = await request(app)
      .post(`/api/vendas/oportunidades/${oportunidadeIdC1}/mover`)
      .set(authHeaders(tokenC1))
      .send({ estagio_id: estagioC2 });
    expect(res.status).toBe(404);
  });
});

// ── Fechar ganha / perdida ────────────────────────────────────────────────────

describe('Oportunidades - Fechar ganha', () => {
  it('POST /api/vendas/oportunidades/:id/ganhar marca como ganha', async () => {
    const res = await request(app)
      .post(`/api/vendas/oportunidades/${oportunidadeIdC1}/ganhar`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ganha');
  });

  it('POST /api/vendas/oportunidades/:id/ganhar define data_fechamento_real', async () => {
    const res = await request(app)
      .get(`/api/vendas/oportunidades/${oportunidadeIdC1}`)
      .set(authHeaders(tokenC1));
    expect(res.body.data_fechamento_real).not.toBeNull();
  });

  it('POST /api/vendas/oportunidades/:id/ganhar registra no histórico', async () => {
    const res = await request(app)
      .get(`/api/vendas/oportunidades/${oportunidadeIdC1}`)
      .set(authHeaders(tokenC1));
    const histStatus = res.body.historico.filter((h) => h.campo_alterado === 'status');
    expect(histStatus.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Oportunidades - Fechar perdida', () => {
  let opPerdidaId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/vendas/oportunidades')
      .set(authHeaders(tokenC1))
      .send({ titulo: 'Oportunidade para perder', valor: 3000 });
    opPerdidaId = res.body.id;
  });

  it('POST /api/vendas/oportunidades/:id/perder marca como perdida', async () => {
    const res = await request(app)
      .post(`/api/vendas/oportunidades/${opPerdidaId}/perder`)
      .set(authHeaders(tokenC1))
      .send({ motivo: 'Preço acima do orçamento' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('perdida');
  });

  it('POST /api/vendas/oportunidades/:id/perder registra motivo_perda', async () => {
    const res = await request(app)
      .get(`/api/vendas/oportunidades/${opPerdidaId}`)
      .set(authHeaders(tokenC1));
    expect(res.body.motivo_perda).toBe('Preço acima do orçamento');
  });

  it('POST /api/vendas/oportunidades/:id/perder retorna 404 para outro cliente', async () => {
    const res = await request(app)
      .post(`/api/vendas/oportunidades/${opPerdidaId}/perder`)
      .set(authHeaders(tokenC2))
      .send({ motivo: 'Hack' });
    expect(res.status).toBe(404);
  });
});

// ── Pipeline completo ─────────────────────────────────────────────────────────

describe('Pipeline completo', () => {
  it('GET /api/vendas/pipeline retorna estagios com oportunidades agrupadas', async () => {
    const res = await request(app)
      .get('/api/vendas/pipeline')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const estagio = res.body.find((e) => e.id === estagioId2C1);
    expect(estagio).toBeDefined();
    expect(Array.isArray(estagio.oportunidades)).toBe(true);
  });

  it('GET /api/vendas/pipeline inclui total e valor_total por estágio', async () => {
    const res = await request(app)
      .get('/api/vendas/pipeline')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    res.body.forEach((estagio) => {
      expect(estagio.total).toBeDefined();
      expect(estagio.valor_total).toBeDefined();
    });
  });

  it('GET /api/vendas/pipeline não inclui estágios de outro cliente', async () => {
    const resC1 = await request(app)
      .get('/api/vendas/pipeline')
      .set(authHeaders(tokenC1));
    const resC2 = await request(app)
      .get('/api/vendas/pipeline')
      .set(authHeaders(tokenC2));

    const idsC1 = resC1.body.map((e) => e.id);
    const idsC2 = resC2.body.map((e) => e.id);
    const intersecao = idsC1.filter((id) => idsC2.includes(id));
    expect(intersecao.length).toBe(0);
  });
});

// ── Métricas ──────────────────────────────────────────────────────────────────

describe('Métricas', () => {
  it('GET /api/vendas/metricas retorna objeto de métricas', async () => {
    const res = await request(app)
      .get('/api/vendas/metricas')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.total).toBeDefined();
    expect(res.body.ganhas).toBeDefined();
    expect(res.body.perdidas).toBeDefined();
    expect(res.body.taxaGanho).toBeDefined();
    expect(res.body.valorEsperado).toBeDefined();
  });

  it('GET /api/vendas/metricas total >= ganhas + perdidas', async () => {
    const res = await request(app)
      .get('/api/vendas/metricas')
      .set(authHeaders(tokenC1));
    expect(res.body.total).toBeGreaterThanOrEqual(res.body.ganhas + res.body.perdidas);
  });

  it('GET /api/vendas/metricas taxaGanho entre 0 e 100', async () => {
    const res = await request(app)
      .get('/api/vendas/metricas')
      .set(authHeaders(tokenC1));
    expect(res.body.taxaGanho).toBeGreaterThanOrEqual(0);
    expect(res.body.taxaGanho).toBeLessThanOrEqual(100);
  });

  it('GET /api/vendas/metricas ganhas >= 1 (temos pelo menos 1 ganha)', async () => {
    const res = await request(app)
      .get('/api/vendas/metricas')
      .set(authHeaders(tokenC1));
    expect(res.body.ganhas).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/vendas/metricas retorna métricas isoladas por cliente', async () => {
    const resC1 = await request(app).get('/api/vendas/metricas').set(authHeaders(tokenC1));
    const resC2 = await request(app).get('/api/vendas/metricas').set(authHeaders(tokenC2));
    expect(resC1.body.total).toBeGreaterThan(resC2.body.total);
  });
});

// ── Deletar ───────────────────────────────────────────────────────────────────

describe('Oportunidades - Deletar', () => {
  let opDeleteId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/vendas/oportunidades')
      .set(authHeaders(tokenC1))
      .send({ titulo: 'Para deletar', valor: 100 });
    opDeleteId = res.body.id;
  });

  it('DELETE /api/vendas/oportunidades/:id retorna 404 para outro cliente', async () => {
    const res = await request(app)
      .delete(`/api/vendas/oportunidades/${opDeleteId}`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(404);
  });

  it('DELETE /api/vendas/oportunidades/:id deleta oportunidade', async () => {
    const res = await request(app)
      .delete(`/api/vendas/oportunidades/${opDeleteId}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET após delete retorna 404', async () => {
    const res = await request(app)
      .get(`/api/vendas/oportunidades/${opDeleteId}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(404);
  });
});

// ── Deletar estágio ───────────────────────────────────────────────────────────

describe('Pipeline - Deletar estágio', () => {
  it('DELETE /api/vendas/pipeline/estagios/:id deleta estágio', async () => {
    const criarRes = await request(app)
      .post('/api/vendas/pipeline/estagios')
      .set(authHeaders(tokenC1))
      .send({ nome: 'Para deletar', cor: '#999' });
    const idDel = criarRes.body.id;

    const res = await request(app)
      .delete(`/api/vendas/pipeline/estagios/${idDel}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
