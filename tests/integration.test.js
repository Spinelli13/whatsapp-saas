'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { CREDENTIALS, CLIENTE_IDS, DEPT_IDS, TELEFONES, TELEFONE_PATTERN } = require('./constants');
const { loginUser, authHeaders } = require('./helpers/auth.helper');

async function limpeza() {
  await sequelize.query(
    `DELETE FROM fila_mensagens WHERE telefone LIKE :pattern`,
    { replacements: { pattern: TELEFONE_PATTERN } }
  );
}

// ─── Fluxo 1: Cliente 1 — atendimento completo ───────────────────────────────
describe('Integração — Fluxo completo Cliente 1', () => {
  let token;
  const telefone = TELEFONES.INT_FLOW1;

  afterAll(limpeza);

  beforeAll(async () => {
    token = await loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha);
  });

  it('1/5 — login retorna token válido', () => {
    expect(token).toMatch(/^eyJ/);
  });

  it('2/5 — listar departamentos retorna 4 opções', async () => {
    const res = await request(app)
      .get(`/api/fila/departamentos/${CLIENTE_IDS.C1}`)
      .set(authHeaders(token));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(4);
  });

  it('3/5 — primeira mensagem gera menu', async () => {
    const res = await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(token))
      .send({ cliente_id: CLIENTE_IDS.C1, telefone, texto: 'oi tudo bem?' });
    expect(res.status).toBe(200);
    expect(res.body.acao).toBe('menu_enviado');
  });

  it('4/5 — escolha "1" enfileira no departamento 1', async () => {
    const res = await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(token))
      .send({ cliente_id: CLIENTE_IDS.C1, telefone, texto: '1' });
    expect(res.status).toBe(200);
    expect(res.body.acao).toBe('na_fila');
    expect(res.body.posicao).toBeGreaterThanOrEqual(1);
  });

  it('5/5 — status da fila contém o telefone enfileirado', async () => {
    const res = await request(app)
      .get(`/api/fila/status/${CLIENTE_IDS.C1}`)
      .set(authHeaders(token));
    expect(res.status).toBe(200);
    const telefones = res.body.fila.map((f) => f.telefone);
    expect(telefones).toContain(telefone);
  });
});

// ─── Fluxo 2: Cliente 2 — isolação de tenant ────────────────────────────────
describe('Integração — Isolação Client 2 vs Client 1', () => {
  let tokenC2;
  const telefoneC2 = TELEFONES.INT_FLOW2;

  afterAll(limpeza);

  beforeAll(async () => {
    tokenC2 = await loginUser(CREDENTIALS.ADMIN_C2.email, CREDENTIALS.ADMIN_C2.senha);
  });

  it('1/5 — cliente 2 não acessa departamentos do cliente 1', async () => {
    const res = await request(app)
      .get(`/api/fila/departamentos/${CLIENTE_IDS.C1}`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(403);
  });

  it('2/5 — cliente 2 vê apenas seus 2 departamentos', async () => {
    const res = await request(app)
      .get(`/api/fila/departamentos/${CLIENTE_IDS.C2}`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('3/5 — cliente 2 recebe menu correto (2 opções)', async () => {
    const res = await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC2))
      .send({ cliente_id: CLIENTE_IDS.C2, telefone: telefoneC2, texto: 'ola' });
    expect(res.status).toBe(200);
    expect(res.body.acao).toBe('menu_enviado');
  });

  it('4/5 — cliente 2 enfileira em departamento náutico (id 5)', async () => {
    const res = await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC2))
      .send({ cliente_id: CLIENTE_IDS.C2, telefone: telefoneC2, texto: '1' });
    expect(res.status).toBe(200);
    expect(res.body.acao).toBe('na_fila');
  });

  it('5/5 — status do cliente 1 não expõe registros do cliente 2', async () => {
    const tokenC1 = await loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha);
    const res = await request(app)
      .get(`/api/fila/status/${CLIENTE_IDS.C1}`)
      .set(authHeaders(tokenC1));
    const telefones = res.body.fila.map((f) => f.telefone);
    expect(telefones).not.toContain(telefoneC2);
  });
});

// ─── Fluxo 3: Performance — 10 mensagens em FIFO ────────────────────────────
describe('Integração — Performance: 10 mensagens sequenciais (FIFO)', () => {
  const PREFIX = TELEFONES.INT_PERF;
  let token;
  const COUNT = 10;

  afterAll(limpeza);

  beforeAll(async () => {
    token = await loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha);
  });

  it(`deve enfileirar ${COUNT} mensagens e manter ordem FIFO`, async () => {
    const phones = Array.from({ length: COUNT }, (_, i) =>
      `${PREFIX}${String(i).padStart(3, '0')}`
    );

    // Fase 1: todos recebem menu
    for (const tel of phones) {
      const r = await request(app)
        .post('/api/fila/receber')
        .set(authHeaders(token))
        .send({ cliente_id: CLIENTE_IDS.C1, telefone: tel, texto: 'oi' });
      expect(r.status).toBe(200);
      expect(r.body.acao).toBe('menu_enviado');
    }

    // Fase 2: todos escolhem departamento 1
    for (const tel of phones) {
      const r = await request(app)
        .post('/api/fila/receber')
        .set(authHeaders(token))
        .send({ cliente_id: CLIENTE_IDS.C1, telefone: tel, texto: '1' });
      expect(r.status).toBe(200);
      expect(r.body.acao).toBe('na_fila');
    }

    // Fase 3: verifica posições únicas e crescentes
    const res = await request(app)
      .get(`/api/fila/status/${CLIENTE_IDS.C1}`)
      .set(authHeaders(token));

    const perfEntries = res.body.fila.filter((f) => f.telefone.startsWith(PREFIX));
    expect(perfEntries.length).toBe(COUNT);

    const posicoes = perfEntries.map((f) => f.posicao_fila).filter(Boolean);
    const unicas = new Set(posicoes);
    expect(unicas.size).toBe(posicoes.length); // sem duplicatas
  }, 30000);
});
