'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { CREDENTIALS, CLIENTE_IDS, DEPT_IDS, TELEFONES, TELEFONE_PATTERN } = require('./constants');
const { loginUser, authHeaders } = require('./helpers/auth.helper');

let tokenC1, tokenC2;

beforeAll(async () => {
  [tokenC1, tokenC2] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ADMIN_C2.email, CREDENTIALS.ADMIN_C2.senha),
  ]);
});

afterEach(async () => {
  await sequelize.query(
    `DELETE FROM fila_mensagens WHERE telefone LIKE :pattern`,
    { replacements: { pattern: TELEFONE_PATTERN } }
  );
});

describe('Fila — GET /api/fila/departamentos/:cliente_id', () => {
  it('cliente 1 deve receber 4 departamentos', async () => {
    const res = await request(app)
      .get(`/api/fila/departamentos/${CLIENTE_IDS.C1}`)
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(4);
  });

  it('cliente 2 deve receber 2 departamentos', async () => {
    const res = await request(app)
      .get(`/api/fila/departamentos/${CLIENTE_IDS.C2}`)
      .set(authHeaders(tokenC2));

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('departamentos devem ter campos id e nome', async () => {
    const res = await request(app)
      .get(`/api/fila/departamentos/${CLIENTE_IDS.C1}`)
      .set(authHeaders(tokenC1));

    res.body.forEach((d) => {
      expect(d).toHaveProperty('id');
      expect(d).toHaveProperty('nome');
    });
  });

  it('cliente 1 não pode acessar departamentos do cliente 2 → 403', async () => {
    const res = await request(app)
      .get(`/api/fila/departamentos/${CLIENTE_IDS.C2}`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(403);
  });
});

describe('Fila — POST /api/fila/receber (menu)', () => {
  it('primeira mensagem deve retornar menu de departamentos', async () => {
    const res = await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC1))
      .send({
        cliente_id: CLIENTE_IDS.C1,
        telefone: TELEFONES.FILA_MENU,
        texto: 'oi',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('acao', 'menu_enviado');
    expect(res.body).toHaveProperty('menu');
    expect(res.body.menu).toMatch(/\d+/);
  });

  it('segunda mensagem com número válido deve enfileirar', async () => {
    // 1a mensagem → menu
    await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC1))
      .send({ cliente_id: CLIENTE_IDS.C1, telefone: TELEFONES.FILA_ESCOLHA, texto: 'oi' });

    // 2a mensagem → escolha do departamento 1
    const res = await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC1))
      .send({ cliente_id: CLIENTE_IDS.C1, telefone: TELEFONES.FILA_ESCOLHA, texto: '1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('acao', 'na_fila');
    expect(res.body).toHaveProperty('posicao');
    expect(res.body.posicao).toBeGreaterThanOrEqual(1);
  });

  it('segunda mensagem com índice inválido deve pedir reenvio do menu', async () => {
    await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC1))
      .send({ cliente_id: CLIENTE_IDS.C1, telefone: TELEFONES.FILA_INVALIDA, texto: 'oi' });

    const res = await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC1))
      .send({ cliente_id: CLIENTE_IDS.C1, telefone: TELEFONES.FILA_INVALIDA, texto: '99' });

    expect(res.status).toBe(200);
    expect(res.body.acao).toBe('menu_reenviado');
  });

  it('cliente_id errado no body → 403', async () => {
    const res = await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC2))
      .send({ cliente_id: CLIENTE_IDS.C1, telefone: TELEFONES.SEC_1, texto: 'oi' });
    expect(res.status).toBe(403);
  });
});

describe('Fila — GET /api/fila/status/:cliente_id', () => {
  it('deve retornar status da fila com campos esperados', async () => {
    const res = await request(app)
      .get(`/api/fila/status/${CLIENTE_IDS.C1}`)
      .set(authHeaders(tokenC1));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('fila');
    expect(Array.isArray(res.body.fila)).toBe(true);
  });

  it('isolação: status do cliente 1 não expõe dados do cliente 2', async () => {
    // Enfileira no cliente 2
    await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC2))
      .send({ cliente_id: CLIENTE_IDS.C2, telefone: TELEFONES.FILA_MANUAL, texto: 'oi' });

    await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC2))
      .send({ cliente_id: CLIENTE_IDS.C2, telefone: TELEFONES.FILA_MANUAL, texto: '1' });

    // Status do cliente 1 não deve conter telefone do cliente 2
    const res = await request(app)
      .get(`/api/fila/status/${CLIENTE_IDS.C1}`)
      .set(authHeaders(tokenC1));

    const telefones = res.body.fila.map((f) => f.telefone);
    expect(telefones).not.toContain(TELEFONES.FILA_MANUAL);
  });
});
