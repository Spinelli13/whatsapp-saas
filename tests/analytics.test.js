'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

let tokenC1, tokenC2;
let recomIdC1;

const hoje = new Date().toISOString().split('T')[0];
const mes30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

beforeAll(async () => {
  await sequelize.query(`DELETE FROM recomendacoes_ia WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM previsoes_ia WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM analise_sentimento WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM metricas_vendas WHERE cliente_id IN (1,2)`);

  [tokenC1, tokenC2] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ADMIN_C2.email, CREDENTIALS.ADMIN_C2.senha),
  ]);
});

afterAll(async () => {
  await sequelize.query(`DELETE FROM recomendacoes_ia WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM previsoes_ia WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM analise_sentimento WHERE cliente_id IN (1,2)`);
  await sequelize.query(`DELETE FROM metricas_vendas WHERE cliente_id IN (1,2)`);
});

// ── Auth guards ────────────────────────────────────────────────────────────────

describe('Auth - Analytics endpoints requerem autenticação', () => {
  it('GET /api/analytics/metricas/diarias retorna 401 sem token', async () => {
    const res = await request(app).get('/api/analytics/metricas/diarias');
    expect(res.status).toBe(401);
  });

  it('POST /api/analytics/metricas/calcular retorna 401 sem token', async () => {
    const res = await request(app).post('/api/analytics/metricas/calcular');
    expect(res.status).toBe(401);
  });

  it('GET /api/analytics/tendencias retorna 401 sem token', async () => {
    const res = await request(app).get('/api/analytics/tendencias');
    expect(res.status).toBe(401);
  });

  it('POST /api/analytics/sentimento/analisar retorna 401 sem token', async () => {
    const res = await request(app).post('/api/analytics/sentimento/analisar').send({ texto: 'ok' });
    expect(res.status).toBe(401);
  });

  it('GET /api/analytics/ia/recomendacoes retorna 401 sem token', async () => {
    const res = await request(app).get('/api/analytics/ia/recomendacoes');
    expect(res.status).toBe(401);
  });
});

// ── Métricas - Cálculo ────────────────────────────────────────────────────────

describe('Métricas - Calcular', () => {
  it('POST /api/analytics/metricas/calcular cria métricas do dia', async () => {
    const res = await request(app)
      .post('/api/analytics/metricas/calcular')
      .set(authHeaders(tokenC1))
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.data).toBe(hoje);
    expect(res.body.cliente_id).toBe(1);
  });

  it('métricas calculadas têm total_oportunidades', async () => {
    const res = await request(app)
      .post('/api/analytics/metricas/calcular')
      .set(authHeaders(tokenC1))
      .send({});
    expect(res.status).toBe(201);
    expect(typeof res.body.total_oportunidades).toBe('number');
  });

  it('métricas calculadas têm taxa_conversao', async () => {
    const res = await request(app)
      .post('/api/analytics/metricas/calcular')
      .set(authHeaders(tokenC1))
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.taxa_conversao).toBeDefined();
  });

  it('métricas calculadas têm ticket_medio', async () => {
    const res = await request(app)
      .post('/api/analytics/metricas/calcular')
      .set(authHeaders(tokenC1))
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.ticket_medio).toBeDefined();
  });
});

// ── Métricas - Listagem ───────────────────────────────────────────────────────

describe('Métricas - Listar', () => {
  it('GET /api/analytics/metricas/diarias retorna 400 sem datas', async () => {
    const res = await request(app)
      .get('/api/analytics/metricas/diarias')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/dataInicio|dataFim/i);
  });

  it('GET /api/analytics/metricas/diarias lista métricas do período', async () => {
    const res = await request(app)
      .get(`/api/analytics/metricas/diarias?dataInicio=${mes30}&dataFim=${hoje}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/analytics/metricas/diarias só retorna dados do cliente', async () => {
    const res = await request(app)
      .get(`/api/analytics/metricas/diarias?dataInicio=${mes30}&dataFim=${hoje}`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(200);
    expect(res.body.every((m) => m.cliente_id === 2)).toBe(true);
  });
});

// ── Tendências ─────────────────────────────────────────────────────────────────

describe('Analytics - Tendências', () => {
  it('GET /api/analytics/tendencias retorna 200', async () => {
    const res = await request(app)
      .get('/api/analytics/tendencias')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
  });

  it('tendências têm campo periodo', async () => {
    const res = await request(app)
      .get('/api/analytics/tendencias')
      .set(authHeaders(tokenC1));
    expect(res.body.periodo).toBe(30);
  });

  it('tendências têm campo tendencia', async () => {
    const res = await request(app)
      .get('/api/analytics/tendencias')
      .set(authHeaders(tokenC1));
    expect(['crescente', 'decrescente', 'estavel']).toContain(res.body.tendencia);
  });

  it('GET /api/analytics/tendencias?dias=7 respeita parâmetro', async () => {
    const res = await request(app)
      .get('/api/analytics/tendencias?dias=7')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.periodo).toBe(7);
  });

  it('tendências têm campo metricas (array)', async () => {
    const res = await request(app)
      .get('/api/analytics/tendencias')
      .set(authHeaders(tokenC1));
    expect(Array.isArray(res.body.metricas)).toBe(true);
  });
});

// ── Sentimento ─────────────────────────────────────────────────────────────────

describe('Sentimento - Análise', () => {
  it('POST /sentimento/analisar retorna 400 sem texto', async () => {
    const res = await request(app)
      .post('/api/analytics/sentimento/analisar')
      .set(authHeaders(tokenC1))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/texto/i);
  });

  it('POST /sentimento/analisar classifica texto positivo', async () => {
    const res = await request(app)
      .post('/api/analytics/sentimento/analisar')
      .set(authHeaders(tokenC1))
      .send({ texto: 'Produto excelente! Adorei tudo, ficou perfeito!' });
    expect(res.status).toBe(201);
    expect(res.body.sentimento).toBe('positivo');
  });

  it('POST /sentimento/analisar classifica texto negativo', async () => {
    const res = await request(app)
      .post('/api/analytics/sentimento/analisar')
      .set(authHeaders(tokenC1))
      .send({ texto: 'Produto ruim, horrível e péssimo atendimento!' });
    expect(res.status).toBe(201);
    expect(res.body.sentimento).toBe('negativo');
  });

  it('POST /sentimento/analisar classifica texto neutro', async () => {
    const res = await request(app)
      .post('/api/analytics/sentimento/analisar')
      .set(authHeaders(tokenC1))
      .send({ texto: 'Recebi o produto dentro do prazo' });
    expect(res.status).toBe(201);
    expect(res.body.sentimento).toBe('neutro');
  });

  it('POST /sentimento/analisar retorna confianca', async () => {
    const res = await request(app)
      .post('/api/analytics/sentimento/analisar')
      .set(authHeaders(tokenC1))
      .send({ texto: 'excelente ótimo maravilha' });
    expect(res.status).toBe(201);
    expect(typeof parseFloat(res.body.confianca)).toBe('number');
  });

  it('POST /sentimento/analisar retorna palavras_chave', async () => {
    const res = await request(app)
      .post('/api/analytics/sentimento/analisar')
      .set(authHeaders(tokenC1))
      .send({ texto: 'produto excelente entrega rápida satisfeito' });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.palavras_chave)).toBe(true);
  });

  it('POST /sentimento/analisar persiste com cliente_id', async () => {
    const res = await request(app)
      .post('/api/analytics/sentimento/analisar')
      .set(authHeaders(tokenC1))
      .send({ texto: 'bom produto' });
    expect(res.status).toBe(201);
    expect(res.body.cliente_id).toBe(1);
  });
});

describe('Sentimento - Histórico', () => {
  it('GET /sentimento/historico lista análises', async () => {
    const res = await request(app)
      .get('/api/analytics/sentimento/historico')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /sentimento/historico?sentimento=positivo filtra por sentimento', async () => {
    const res = await request(app)
      .get('/api/analytics/sentimento/historico?sentimento=positivo')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.every((a) => a.sentimento === 'positivo')).toBe(true);
  });

  it('C2 não vê sentimentos de C1', async () => {
    const res = await request(app)
      .get('/api/analytics/sentimento/historico')
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(200);
    expect(res.body.every((a) => a.cliente_id === 2)).toBe(true);
  });
});

// ── IA - Previsões ─────────────────────────────────────────────────────────────

describe('IA - Previsões', () => {
  it('GET /ia/previsoes retorna lista (possivelmente vazia)', async () => {
    const res = await request(app)
      .get('/api/analytics/ia/previsoes')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /ia/previsoes retorna só do cliente', async () => {
    const res = await request(app)
      .get('/api/analytics/ia/previsoes')
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── IA - Recomendações ─────────────────────────────────────────────────────────

describe('IA - Recomendações CRUD', () => {
  it('GET /ia/recomendacoes retorna lista vazia inicialmente', async () => {
    const res = await request(app)
      .get('/api/analytics/ia/recomendacoes')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('POST /ia/recomendacoes retorna 400 sem titulo', async () => {
    const res = await request(app)
      .post('/api/analytics/ia/recomendacoes')
      .set(authHeaders(tokenC1))
      .send({ descricao: 'Descrição sem título' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/título|titulo/i);
  });

  it('POST /ia/recomendacoes retorna 400 sem descricao', async () => {
    const res = await request(app)
      .post('/api/analytics/ia/recomendacoes')
      .set(authHeaders(tokenC1))
      .send({ titulo: 'Título sem descrição' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/descrição|descricao/i);
  });

  it('POST /ia/recomendacoes cria recomendação com sucesso', async () => {
    const res = await request(app)
      .post('/api/analytics/ia/recomendacoes')
      .set(authHeaders(tokenC1))
      .send({
        titulo: 'Ligar para cliente VIP',
        descricao: 'O cliente Silva não foi contactado há 7 dias.',
        tipo: 'proximo_passo',
        prioridade: 'alta',
        acao_sugerida: 'Ligar agora',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.titulo).toBe('Ligar para cliente VIP');
    expect(res.body.visualizado).toBe(false);
    expect(res.body.cliente_id).toBe(1);
    recomIdC1 = res.body.id;
  });

  it('GET /ia/recomendacoes lista a recomendação criada', async () => {
    const res = await request(app)
      .get('/api/analytics/ia/recomendacoes')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(recomIdC1);
  });

  it('C2 não vê recomendações de C1', async () => {
    const res = await request(app)
      .get('/api/analytics/ia/recomendacoes')
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(200);
    const ids = res.body.map((r) => r.id);
    expect(ids).not.toContain(recomIdC1);
  });
});

describe('IA - Marcar Visualizado', () => {
  it('POST /ia/recomendacoes/:id/visualizado retorna 404 para ID inexistente', async () => {
    const res = await request(app)
      .post('/api/analytics/ia/recomendacoes/00000000-0000-0000-0000-000000000000/visualizado')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(404);
  });

  it('C2 não marca recomendação de C1 como visualizada', async () => {
    const res = await request(app)
      .post(`/api/analytics/ia/recomendacoes/${recomIdC1}/visualizado`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(404);
  });

  it('POST /ia/recomendacoes/:id/visualizado marca como visualizado', async () => {
    const res = await request(app)
      .post(`/api/analytics/ia/recomendacoes/${recomIdC1}/visualizado`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.visualizado).toBe(true);
  });

  it('GET /ia/recomendacoes não lista recomendações visualizadas', async () => {
    const res = await request(app)
      .get('/api/analytics/ia/recomendacoes')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    const ids = res.body.map((r) => r.id);
    expect(ids).not.toContain(recomIdC1);
  });
});
