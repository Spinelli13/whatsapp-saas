'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS, CLIENTE_IDS } = require('./constants');

let tokenC1, tokenC2;

beforeAll(async () => {
  [tokenC1, tokenC2] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ADMIN_C2.email, CREDENTIALS.ADMIN_C2.senha),
  ]);
});

// ── Listar planos ─────────────────────────────────────────────────────────

describe('GET /api/planos/disponibles', () => {
  it('lista os 3 planos sem autenticação', async () => {
    const res = await request(app).get('/api/planos/disponibles');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
  });

  it('inclui campos obrigatórios do plano', async () => {
    const res = await request(app).get('/api/planos/disponibles');
    const plano = res.body[0];

    expect(plano).toHaveProperty('nome');
    expect(plano).toHaveProperty('preco_mensal');
    expect(plano).toHaveProperty('usuarios_limite');
    expect(plano).toHaveProperty('mensagens_limite');
    expect(plano).toHaveProperty('departamentos_limite');
    expect(plano).toHaveProperty('features');
    expect(Array.isArray(plano.features)).toBe(true);
  });

  it('retorna planos ordenados por preco_mensal ASC', async () => {
    const res = await request(app).get('/api/planos/disponibles');
    const precos = res.body.map((p) => parseFloat(p.preco_mensal));

    for (let i = 1; i < precos.length; i++) {
      expect(precos[i]).toBeGreaterThanOrEqual(precos[i - 1]);
    }
  });
});

// ── Plano do cliente ──────────────────────────────────────────────────────

describe('GET /api/planos/meu-plano', () => {
  it('requer autenticação', async () => {
    const res = await request(app).get('/api/planos/meu-plano');
    expect(res.status).toBe(401);
  });

  it('retorna plano ativo do cliente 1', async () => {
    const res = await request(app)
      .get('/api/planos/meu-plano')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cliente_id', CLIENTE_IDS.C1);
    expect(res.body).toHaveProperty('status', 'ativo');
    expect(res.body).toHaveProperty('Plano');
    expect(res.body.Plano).toHaveProperty('nome');
  });

  it('retorna plano ativo do cliente 2', async () => {
    const res = await request(app)
      .get('/api/planos/meu-plano')
      .set(authHeaders(tokenC2));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cliente_id', CLIENTE_IDS.C2);
  });
});

// ── Uso do cliente ────────────────────────────────────────────────────────

describe('GET /api/planos/meu-uso', () => {
  it('requer autenticação', async () => {
    const res = await request(app).get('/api/planos/meu-uso');
    expect(res.status).toBe(401);
  });

  it('retorna uso e limites do cliente', async () => {
    const res = await request(app)
      .get('/api/planos/meu-uso')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('limites');
  });

  it('limites têm as três dimensões esperadas', async () => {
    const res = await request(app)
      .get('/api/planos/meu-uso')
      .set(authHeaders(tokenC1));

    const { limites } = res.body;
    expect(limites).toHaveProperty('mensagens');
    expect(limites).toHaveProperty('usuarios');
    expect(limites).toHaveProperty('departamentos');
    expect(limites.mensagens).toHaveProperty('usado');
    expect(limites.mensagens).toHaveProperty('limite');
    expect(limites.mensagens).toHaveProperty('atingiu');
  });
});

// ── Atribuir plano ────────────────────────────────────────────────────────

describe('POST /api/planos/cliente/:id/plano/:id', () => {
  afterAll(async () => {
    // Restaurar cliente 1 → plano profissional (id=2) após os testes alterarem
    await sequelize.query(
      `UPDATE cliente_plano SET status = 'cancelado' WHERE cliente_id = 1 AND status = 'ativo'`
    );
    await sequelize.query(`
      INSERT INTO cliente_plano (cliente_id, plano_id, status, data_inicio, data_proxima_renovacao, criado_em)
      VALUES (1, 2, 'ativo', NOW(), NOW() + INTERVAL '30 days', NOW())
      ON CONFLICT DO NOTHING
    `);
  });

  it('admin pode atribuir plano a cliente', async () => {
    // Usar tokenC1 (legacy token sem role_id → verificarPermissao passa through)
    const res = await request(app)
      .post('/api/planos/cliente/1/plano/1')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('plano_id', 1);
    expect(res.body).toHaveProperty('status', 'ativo');
  });

  it('retorna 404 para plano inexistente', async () => {
    const res = await request(app)
      .post('/api/planos/cliente/1/plano/9999')
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(404);
  });
});

// ── Limite de mensagens ───────────────────────────────────────────────────

describe('Limite de mensagens — POST /api/fila/receber', () => {
  const mesAtual = new Date().toISOString().substring(0, 7);

  afterAll(async () => {
    await sequelize.query(
      `DELETE FROM uso_cliente WHERE cliente_id = :cid AND mes_ano = :mes`,
      { replacements: { cid: CLIENTE_IDS.C2, mes: mesAtual } }
    );
    // Limpar telefones criados nesse describe
    await sequelize.query(
      `DELETE FROM fila_mensagens WHERE telefone LIKE '5585999%'`
    );
  });

  it('bloqueia POST /receber com 402 quando limite atingido', async () => {
    // Inserir/atualizar registro de uso ao limite do plano básico (1000 msg)
    await sequelize.query(`
      INSERT INTO uso_cliente (cliente_id, mes_ano, mensagens_usadas, usuarios_criados, departamentos_criados, criado_em)
      VALUES (:cid, :mes, 1000, 0, 0, NOW())
      ON CONFLICT DO NOTHING
    `, { replacements: { cid: CLIENTE_IDS.C2, mes: mesAtual } });

    await sequelize.query(`
      UPDATE uso_cliente SET mensagens_usadas = 1000
      WHERE cliente_id = :cid AND mes_ano = :mes
    `, { replacements: { cid: CLIENTE_IDS.C2, mes: mesAtual } });

    const res = await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC2))
      .send({ cliente_id: CLIENTE_IDS.C2, telefone: '5585999000001', texto: 'oi' });

    expect(res.status).toBe(402);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('limites');
  });
});

// ── Limite de usuários ────────────────────────────────────────────────────

describe('Limite de usuários — POST /api/usuarios', () => {
  const mesAtual = new Date().toISOString().substring(0, 7);
  const emailTeste = `limite_test_${Date.now()}@barcos.com`;

  afterAll(async () => {
    await sequelize.query(
      `DELETE FROM uso_cliente WHERE cliente_id = :cid AND mes_ano = :mes`,
      { replacements: { cid: CLIENTE_IDS.C2, mes: mesAtual } }
    );
    await sequelize.query(
      `DELETE FROM usuarios WHERE email = :email`,
      { replacements: { email: emailTeste } }
    );
  });

  it('bloqueia criação com 402 quando limite de usuários atingido', async () => {
    await sequelize.query(`
      INSERT INTO uso_cliente (cliente_id, mes_ano, mensagens_usadas, usuarios_criados, departamentos_criados, criado_em)
      VALUES (:cid, :mes, 0, 1, 0, NOW())
      ON CONFLICT DO NOTHING
    `, { replacements: { cid: CLIENTE_IDS.C2, mes: mesAtual } });

    await sequelize.query(`
      UPDATE uso_cliente SET usuarios_criados = 1
      WHERE cliente_id = :cid AND mes_ano = :mes
    `, { replacements: { cid: CLIENTE_IDS.C2, mes: mesAtual } });

    const res = await request(app)
      .post('/api/usuarios')
      .set(authHeaders(tokenC2))
      .send({ nome: 'Teste Limite', email: emailTeste, senha: 'password123' });

    expect(res.status).toBe(402);
    expect(res.body).toHaveProperty('error');
  });
});
