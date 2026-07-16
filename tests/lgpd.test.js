'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize, AuditLog, ExportacaoDados, DataRetentionPolicy } = require('../src/backend/models');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS, CLIENTE_IDS } = require('./constants');

let tokenC1, tokenC2;

beforeAll(async () => {
  // Clean up LGPD test state from any previous run
  await sequelize.query(`DELETE FROM exportacao_dados WHERE cliente_id IN (1, 2)`);
  await sequelize.query(`DELETE FROM data_retention_policy WHERE cliente_id IN (1, 2)`);
  await sequelize.query(`DELETE FROM audit_log WHERE cliente_id IN (1, 2)`);

  [tokenC1, tokenC2] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ADMIN_C2.email, CREDENTIALS.ADMIN_C2.senha),
  ]);
});

afterAll(async () => {
  await sequelize.query(`DELETE FROM exportacao_dados WHERE cliente_id IN (1, 2)`);
  await sequelize.query(`DELETE FROM data_retention_policy WHERE cliente_id IN (1, 2)`);
  await sequelize.query(`DELETE FROM audit_log WHERE cliente_id IN (1, 2)`);
});

// ── Audit Trail ───────────────────────────────────────────────────────────────

describe('GET /api/audit/logs', () => {
  beforeAll(async () => {
    // Seed some audit entries for C1
    await AuditLog.bulkCreate([
      { usuario_id: 1, cliente_id: 1, tabela: 'usuarios', acao: 'CREATE', dados_antes: null, dados_depois: { nome: 'Test' } },
      { usuario_id: 1, cliente_id: 1, tabela: 'fila_mensagens', acao: 'UPDATE', dados_antes: { status: 'aguardando' }, dados_depois: { status: 'atendendo' } },
      { usuario_id: 1, cliente_id: 1, tabela: 'usuarios', acao: 'DELETE', dados_antes: { id: 99 }, dados_depois: null },
    ]);
  });

  it('admin pode listar audit logs do seu cliente', async () => {
    const res = await request(app)
      .get('/api/audit/logs')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  it('retorna campos corretos no audit log', async () => {
    const res = await request(app)
      .get('/api/audit/logs')
      .set(authHeaders(tokenC1));

    const log = res.body[0];
    expect(log).toHaveProperty('id');
    expect(log).toHaveProperty('tabela');
    expect(log).toHaveProperty('acao');
    expect(log).toHaveProperty('criado_em');
    expect(['CREATE', 'UPDATE', 'DELETE']).toContain(log.acao);
  });

  it('filtra por tabela', async () => {
    const res = await request(app)
      .get('/api/audit/logs?tabela=usuarios')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(res.body.every((l) => l.tabela === 'usuarios')).toBe(true);
  });

  it('filtra por acao', async () => {
    const res = await request(app)
      .get('/api/audit/logs?acao=CREATE')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(res.body.every((l) => l.acao === 'CREATE')).toBe(true);
  });

  it('não vê audit logs de outro cliente', async () => {
    const res = await request(app)
      .get('/api/audit/logs')
      .set(authHeaders(tokenC2));

    expect(res.status).toBe(200);
    // C2 has no audit entries seeded — should be empty
    const c1Entries = res.body.filter((l) => l.cliente_id === CLIENTE_IDS.C1);
    expect(c1Entries).toHaveLength(0);
  });

  it('requer autenticação', async () => {
    const res = await request(app).get('/api/audit/logs');
    expect(res.status).toBe(401);
  });

  it('requer role admin', async () => {
    const { loginUser: lu } = require('./helpers/auth.helper');
    const atendenteToken = await lu(CREDENTIALS.ATENDENTE_C1.email, CREDENTIALS.ATENDENTE_C1.senha);
    const res = await request(app)
      .get('/api/audit/logs')
      .set(authHeaders(atendenteToken));
    expect(res.status).toBe(403);
  });
});

// ── Data Retention Policy ─────────────────────────────────────────────────────

describe('GET /api/admin/retention-policy', () => {
  it('retorna política com defaults para cliente sem política cadastrada', async () => {
    const res = await request(app)
      .get('/api/admin/retention-policy')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cliente_id', CLIENTE_IDS.C1);
    expect(res.body).toHaveProperty('dias_retencao_historico');
    expect(res.body).toHaveProperty('dias_retencao_logs');
    expect(res.body).toHaveProperty('deletar_automaticamente');
  });

  it('defaults são 180 dias histórico, 90 dias logs', async () => {
    const res = await request(app)
      .get('/api/admin/retention-policy')
      .set(authHeaders(tokenC2));

    expect(res.status).toBe(200);
    expect(res.body.dias_retencao_historico).toBe(180);
    expect(res.body.dias_retencao_logs).toBe(90);
    expect(res.body.deletar_automaticamente).toBe(true);
  });

  it('requer autenticação', async () => {
    const res = await request(app).get('/api/admin/retention-policy');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/admin/retention-policy', () => {
  it('admin pode atualizar política de retenção', async () => {
    const res = await request(app)
      .put('/api/admin/retention-policy')
      .set(authHeaders(tokenC1))
      .send({ dias_retencao_historico: 365, dias_retencao_logs: 180 });

    expect(res.status).toBe(200);
    expect(res.body.dias_retencao_historico).toBe(365);
    expect(res.body.dias_retencao_logs).toBe(180);
  });

  it('pode desativar cleanup automático', async () => {
    const res = await request(app)
      .put('/api/admin/retention-policy')
      .set(authHeaders(tokenC1))
      .send({ deletar_automaticamente: false });

    expect(res.status).toBe(200);
    expect(res.body.deletar_automaticamente).toBe(false);
  });

  it('GET reflete as atualizações', async () => {
    await request(app)
      .put('/api/admin/retention-policy')
      .set(authHeaders(tokenC1))
      .send({ dias_retencao_historico: 270 });

    const getRes = await request(app)
      .get('/api/admin/retention-policy')
      .set(authHeaders(tokenC1));

    expect(getRes.body.dias_retencao_historico).toBe(270);
  });
});

// ── Data Export (LGPD) ────────────────────────────────────────────────────────

describe('POST /api/data/exportar', () => {
  it('solicita exportação de dados com sucesso', async () => {
    const res = await request(app)
      .post('/api/data/exportar')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('exportacao_id');
    expect(res.body).toHaveProperty('mensagem');
    expect(typeof res.body.exportacao_id).toBe('number');
  });

  it('retorna 409 se já existe exportação em andamento', async () => {
    const res = await request(app)
      .post('/api/data/exportar')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('requer autenticação', async () => {
    const res = await request(app).post('/api/data/exportar');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/data/exportacoes', () => {
  it('lista exportações do usuário autenticado', async () => {
    const res = await request(app)
      .get('/api/data/exportacoes')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('exportação tem campos status, criado_em e expira_em', async () => {
    const res = await request(app)
      .get('/api/data/exportacoes')
      .set(authHeaders(tokenC1));

    const exp = res.body[0];
    expect(exp).toHaveProperty('status');
    expect(exp).toHaveProperty('criado_em');
    expect(exp).toHaveProperty('expira_em');
    expect(['pendente', 'processando', 'pronto', 'erro']).toContain(exp.status);
  });

  it('não retorna exportações de outro usuário', async () => {
    const res = await request(app)
      .get('/api/data/exportacoes')
      .set(authHeaders(tokenC2));

    expect(res.status).toBe(200);
    // C2 admin hasn't requested an export in this test run
    const exportacoesC1 = res.body.filter((e) => e.cliente_id === CLIENTE_IDS.C1);
    expect(exportacoesC1).toHaveLength(0);
  });

  it('requer autenticação', async () => {
    const res = await request(app).get('/api/data/exportacoes');
    expect(res.status).toBe(401);
  });
});

// ── Right to be Forgotten ─────────────────────────────────────────────────────

describe('POST /api/data/solicitar-delecao', () => {
  it('solicita deletação e retorna confirmação', async () => {
    const res = await request(app)
      .post('/api/data/solicitar-delecao')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'solicitacao_recebida');
    expect(res.body).toHaveProperty('usuario_id');
    expect(res.body).toHaveProperty('data_solicitacao');
    expect(res.body).toHaveProperty('nota');
  });

  it('requer autenticação', async () => {
    const res = await request(app).post('/api/data/solicitar-delecao');
    expect(res.status).toBe(401);
  });
});
