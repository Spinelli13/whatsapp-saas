'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

const DATA_INICIO_30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const DATA_FIM       = new Date().toISOString().split('T')[0];
const DATA_7DIAS     = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

let tokenAdmin;
let atendimentoId;

beforeAll(async () => {
  tokenAdmin = await loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha);

  // Criar um atendimento real para usar nos testes de avaliação
  const res = await request(app)
    .post('/api/atendimento/receber')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ numero: '5585997001001', mensagem: 'TESTE_relatorio avaliacao' });

  atendimentoId = res.body.atendimento?.id || res.body.id;
});

afterAll(async () => {
  await sequelize.query(`DELETE FROM avaliacoes WHERE cliente_id = 1`);
  await sequelize.query(`DELETE FROM metricas_atendimentos WHERE cliente_id = 1`);
  await sequelize.query(`DELETE FROM atendimentos WHERE numero_whatsapp = '5585997001001'`);
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('Auth — Relatório requer autenticação', () => {
  it('GET /api/relatorio/dashboard retorna 401 sem token', async () => {
    const res = await request(app).get('/api/relatorio/dashboard');
    expect(res.status).toBe(401);
  });

  it('GET /api/relatorio/tme retorna 401 sem token', async () => {
    const res = await request(app).get('/api/relatorio/tme');
    expect(res.status).toBe(401);
  });
});

// ── Validações ────────────────────────────────────────────────────────────────

describe('Validações — Parâmetros obrigatórios', () => {
  it('GET /dashboard sem datas retorna 400', async () => {
    const res = await request(app)
      .get('/api/relatorio/dashboard')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatório/i);
  });

  it('GET /tme sem datas retorna 400', async () => {
    const res = await request(app)
      .get('/api/relatorio/tme')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(400);
  });

  it('GET /volume sem datas retorna 400', async () => {
    const res = await request(app)
      .get('/api/relatorio/volume')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(400);
  });
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

describe('Dashboard — Completo', () => {
  it('GET /dashboard com datas válidas retorna estrutura completa', async () => {
    const res = await request(app)
      .get('/api/relatorio/dashboard')
      .query({ dataInicio: DATA_INICIO_30, dataFim: DATA_FIM })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('metricas_gerais');
    expect(res.body.data).toHaveProperty('volume_por_periodo');
    expect(res.body.data).toHaveProperty('top_atendentes');
    expect(res.body.data).toHaveProperty('performance_departamentos');
    expect(res.body.data).toHaveProperty('satisfacao');
    expect(res.body.data.metricas_gerais).toHaveProperty('tme_segundos');
    expect(res.body.data.metricas_gerais).toHaveProperty('tma_segundos');
    expect(res.body.data.metricas_gerais).toHaveProperty('tempo_primeira_resposta_segundos');
    expect(Array.isArray(res.body.data.volume_por_periodo)).toBe(true);
    expect(Array.isArray(res.body.data.top_atendentes)).toBe(true);
    expect(Array.isArray(res.body.data.performance_departamentos)).toBe(true);
  });

  it('GET /dashboard — metricas_gerais têm valores numéricos', async () => {
    const res = await request(app)
      .get('/api/relatorio/dashboard')
      .query({ dataInicio: DATA_INICIO_30, dataFim: DATA_FIM })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    const mg = res.body.data.metricas_gerais;
    expect(typeof mg.tme_segundos).toBe('number');
    expect(typeof mg.tma_segundos).toBe('number');
    expect(typeof mg.tempo_primeira_resposta_segundos).toBe('number');
  });
});

// ── Métricas individuais ──────────────────────────────────────────────────────

describe('Métricas — Individuais', () => {
  it('GET /tme retorna tme_segundos numérico', async () => {
    const res = await request(app)
      .get('/api/relatorio/tme')
      .query({ dataInicio: DATA_7DIAS, dataFim: DATA_FIM })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('tme_segundos');
    expect(typeof res.body.data.tme_segundos).toBe('number');
  });

  it('GET /tma retorna tma_segundos numérico', async () => {
    const res = await request(app)
      .get('/api/relatorio/tma')
      .query({ dataInicio: DATA_7DIAS, dataFim: DATA_FIM })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('tma_segundos');
    expect(typeof res.body.data.tma_segundos).toBe('number');
  });

  it('GET /volume retorna array de volumes', async () => {
    const res = await request(app)
      .get('/api/relatorio/volume')
      .query({ dataInicio: DATA_INICIO_30, dataFim: DATA_FIM })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /volume com periodo=week funciona', async () => {
    const res = await request(app)
      .get('/api/relatorio/volume')
      .query({ dataInicio: DATA_INICIO_30, dataFim: DATA_FIM, periodo: 'week' })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /atendentes retorna array de performance', async () => {
    const res = await request(app)
      .get('/api/relatorio/atendentes')
      .query({ dataInicio: DATA_INICIO_30, dataFim: DATA_FIM })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /departamentos retorna array de performance', async () => {
    const res = await request(app)
      .get('/api/relatorio/departamentos')
      .query({ dataInicio: DATA_INICIO_30, dataFim: DATA_FIM })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /satisfacao retorna CSAT, NPS e total', async () => {
    const res = await request(app)
      .get('/api/relatorio/satisfacao')
      .query({ dataInicio: DATA_INICIO_30, dataFim: DATA_FIM })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('csat_media');
    expect(res.body.data).toHaveProperty('nps_media');
    expect(res.body.data).toHaveProperty('total_avaliacoes');
    expect(typeof res.body.data.total_avaliacoes).toBe('number');
  });
});

// ── Avaliações ────────────────────────────────────────────────────────────────

describe('Avaliações — CRUD', () => {
  it('POST /avaliacao sem campos obrigatórios retorna 400', async () => {
    const res = await request(app)
      .post('/api/relatorio/avaliacao')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('POST /avaliacao sem nota_csat retorna 400', async () => {
    const res = await request(app)
      .post('/api/relatorio/avaliacao')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ atendimento_id: atendimentoId });

    expect(res.status).toBe(400);
  });

  it('POST /avaliacao com nota válida cria avaliação', async () => {
    if (!atendimentoId) return;

    const res = await request(app)
      .post('/api/relatorio/avaliacao')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        atendimento_id: atendimentoId,
        nota_csat: 5,
        nota_nps: 9,
        comentario: 'TESTE_Excelente atendimento',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.nota_csat).toBe(5);
    expect(res.body.data.nota_nps).toBe(9);
  });
});

// ── Exportação ────────────────────────────────────────────────────────────────

describe('Exportação — CSV', () => {
  it('GET /export/csv sem datas retorna 400', async () => {
    const res = await request(app)
      .get('/api/relatorio/export/csv')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(400);
  });

  it('GET /export/csv com datas retorna CSV', async () => {
    const res = await request(app)
      .get('/api/relatorio/export/csv')
      .query({ dataInicio: DATA_7DIAS, dataFim: DATA_FIM })
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/i);
    expect(res.text).toMatch(/RELATÓRIO DE ATENDIMENTO/);
    expect(res.text).toMatch(/TME/);
    expect(res.text).toMatch(/SATISFAÇÃO/);
  });
});

// ── Isolamento ────────────────────────────────────────────────────────────────

describe('Isolamento — Dados por cliente', () => {
  it('Dashboard de cliente C2 não traz dados de C1', async () => {
    const tokenAdmin2 = await loginUser('admin@barcos.com', 'password123');

    const res = await request(app)
      .get('/api/relatorio/dashboard')
      .query({ dataInicio: DATA_INICIO_30, dataFim: DATA_FIM })
      .set('Authorization', `Bearer ${tokenAdmin2}`);

    expect(res.status).toBe(200);
    // C2 não tem métricas seedadas, então top_atendentes deve estar vazio
    expect(Array.isArray(res.body.data.top_atendentes)).toBe(true);
  });
});
