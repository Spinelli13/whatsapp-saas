'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const {
  CREDENTIALS, CLIENTE_IDS, DEPT_IDS,
  TELEFONES, TICKET_TELEFONES,
  TELEFONE_PATTERN, TICKET_PATTERN,
} = require('./constants');
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

// Helper: cria ticket via API e retorna ticket_id
async function criarTicket(token, clienteId, telefone, deptIndex = '1') {
  await request(app)
    .post('/api/fila/receber')
    .set(authHeaders(token))
    .send({ cliente_id: clienteId, telefone, texto: 'oi' });

  const res = await request(app)
    .post('/api/fila/receber')
    .set(authHeaders(token))
    .send({ cliente_id: clienteId, telefone, texto: deptIndex });

  return res.body.ticket_id;
}

// ── Departamentos ─────────────────────────────────────────────────────────

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

// ── Receber mensagem ──────────────────────────────────────────────────────

describe('Fila — POST /api/fila/receber (menu)', () => {
  it('primeira mensagem deve retornar menu de departamentos', async () => {
    const res = await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC1))
      .send({ cliente_id: CLIENTE_IDS.C1, telefone: TELEFONES.FILA_MENU, texto: 'oi' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('acao', 'menu_enviado');
    expect(res.body).toHaveProperty('menu');
    expect(res.body.menu).toMatch(/\d+/);
  });

  it('segunda mensagem com número válido deve enfileirar', async () => {
    await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC1))
      .send({ cliente_id: CLIENTE_IDS.C1, telefone: TELEFONES.FILA_ESCOLHA, texto: 'oi' });

    const res = await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC1))
      .send({ cliente_id: CLIENTE_IDS.C1, telefone: TELEFONES.FILA_ESCOLHA, texto: '1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('acao', 'na_fila');
    expect(res.body).toHaveProperty('posicao');
    expect(res.body.posicao).toBeGreaterThanOrEqual(1);
    expect(res.body).toHaveProperty('ticket_id'); // novo campo
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

// ── Status da fila ────────────────────────────────────────────────────────

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
    await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC2))
      .send({ cliente_id: CLIENTE_IDS.C2, telefone: TELEFONES.FILA_MANUAL, texto: 'oi' });

    await request(app)
      .post('/api/fila/receber')
      .set(authHeaders(tokenC2))
      .send({ cliente_id: CLIENTE_IDS.C2, telefone: TELEFONES.FILA_MANUAL, texto: '1' });

    const res = await request(app)
      .get(`/api/fila/status/${CLIENTE_IDS.C1}`)
      .set(authHeaders(tokenC1));

    const telefones = res.body.fila.map((f) => f.telefone);
    expect(telefones).not.toContain(TELEFONES.FILA_MANUAL);
  });
});

// ── Ticket: Histórico ─────────────────────────────────────────────────────

describe('Fila — Ticket: Histórico', () => {
  let token;
  let ticketId;

  beforeAll(async () => {
    token = await loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha);
    ticketId = await criarTicket(token, CLIENTE_IDS.C1, TICKET_TELEFONES.HIST);
  });

  afterAll(async () => {
    await sequelize.query(
      `DELETE FROM fila_mensagens WHERE telefone LIKE :pattern`,
      { replacements: { pattern: TICKET_PATTERN } }
    );
  });

  it('GET /historico retorna objeto com ticket, notas e historico', async () => {
    const res = await request(app)
      .get(`/api/fila/tickets/${ticketId}/historico`)
      .set(authHeaders(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ticket');
    expect(res.body).toHaveProperty('notas');
    expect(res.body).toHaveProperty('historico');
    expect(Array.isArray(res.body.notas)).toBe(true);
    expect(Array.isArray(res.body.historico)).toBe(true);
  });

  it('ticket retornado tem ticket_status "novo"', async () => {
    const res = await request(app)
      .get(`/api/fila/tickets/${ticketId}/historico`)
      .set(authHeaders(token));
    expect(res.body.ticket.ticket_status).toBe('novo');
  });

  it('historico contém entrada "criado" gerada automaticamente', async () => {
    const res = await request(app)
      .get(`/api/fila/tickets/${ticketId}/historico`)
      .set(authHeaders(token));
    const acoes = res.body.historico.map((h) => h.acao);
    expect(acoes).toContain('criado');
  });

  it('cliente 2 não acessa histórico de ticket do cliente 1 → 403', async () => {
    const res = await request(app)
      .get(`/api/fila/tickets/${ticketId}/historico`)
      .set(authHeaders(tokenC2));
    expect(res.status).toBe(403);
  });

  it('ticket inexistente → 404', async () => {
    const res = await request(app)
      .get('/api/fila/tickets/00000000-0000-0000-0000-000000000000/historico')
      .set(authHeaders(token));
    expect(res.status).toBe(404);
  });

  it('sem token → 401', async () => {
    const res = await request(app)
      .get(`/api/fila/tickets/${ticketId}/historico`);
    expect(res.status).toBe(401);
  });
});

// ── Ticket: Notas ─────────────────────────────────────────────────────────

describe('Fila — Ticket: Notas', () => {
  let token;
  let ticketId;

  beforeAll(async () => {
    token = await loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha);
    ticketId = await criarTicket(token, CLIENTE_IDS.C1, TICKET_TELEFONES.NOTA_1);
  });

  afterAll(async () => {
    await sequelize.query(
      `DELETE FROM fila_mensagens WHERE telefone LIKE :pattern`,
      { replacements: { pattern: TICKET_PATTERN } }
    );
  });

  it('POST /notas cria nota → 201', async () => {
    const res = await request(app)
      .post(`/api/fila/tickets/${ticketId}/notas`)
      .set(authHeaders(token))
      .send({ conteudo: 'Cliente solicitou retorno por email.', privada: false });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.conteudo).toBe('Cliente solicitou retorno por email.');
    expect(res.body.privada).toBe(false);
    expect(res.body.ticket_id).toBe(ticketId);
  });

  it('nota privada é criada com privada=true', async () => {
    const res = await request(app)
      .post(`/api/fila/tickets/${ticketId}/notas`)
      .set(authHeaders(token))
      .send({ conteudo: 'Nota interna confidencial.', privada: true });

    expect(res.status).toBe(201);
    expect(res.body.privada).toBe(true);
  });

  it('nota aparece no histórico (acao: nota_adicionada)', async () => {
    await request(app)
      .post(`/api/fila/tickets/${ticketId}/notas`)
      .set(authHeaders(token))
      .send({ conteudo: 'Nota para verificar no historico.' });

    const res = await request(app)
      .get(`/api/fila/tickets/${ticketId}/historico`)
      .set(authHeaders(token));

    const acoes = res.body.historico.map((h) => h.acao);
    expect(acoes).toContain('nota_adicionada');
    expect(res.body.notas.length).toBeGreaterThan(0);
  });

  it('conteúdo vazio → 400', async () => {
    const res = await request(app)
      .post(`/api/fila/tickets/${ticketId}/notas`)
      .set(authHeaders(token))
      .send({ conteudo: '' });
    expect(res.status).toBe(400);
  });

  it('sem conteúdo no body → 400', async () => {
    const res = await request(app)
      .post(`/api/fila/tickets/${ticketId}/notas`)
      .set(authHeaders(token))
      .send({});
    expect(res.status).toBe(400);
  });

  it('cliente 2 não adiciona nota em ticket do cliente 1 → 403', async () => {
    const res = await request(app)
      .post(`/api/fila/tickets/${ticketId}/notas`)
      .set(authHeaders(tokenC2))
      .send({ conteudo: 'Tentativa de injeção indevida.' });
    expect(res.status).toBe(403);
  });

  it('nota em ticket inexistente → 404', async () => {
    const res = await request(app)
      .post('/api/fila/tickets/00000000-0000-0000-0000-000000000000/notas')
      .set(authHeaders(token))
      .send({ conteudo: 'Nota em nada.' });
    expect(res.status).toBe(404);
  });
});

// ── Ticket: Status ────────────────────────────────────────────────────────

describe('Fila — Ticket: Status', () => {
  let token;
  let ticketId;

  beforeAll(async () => {
    token = await loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha);
    ticketId = await criarTicket(token, CLIENTE_IDS.C1, TICKET_TELEFONES.STATUS);
  });

  afterAll(async () => {
    await sequelize.query(
      `DELETE FROM fila_mensagens WHERE telefone LIKE :pattern`,
      { replacements: { pattern: TICKET_PATTERN } }
    );
  });

  it('PUT /status muda ticket_status → 200', async () => {
    const res = await request(app)
      .put(`/api/fila/tickets/${ticketId}/status`)
      .set(authHeaders(token))
      .send({ status: 'respondendo' });

    expect(res.status).toBe(200);
    expect(res.body.ticket_status).toBe('respondendo');
  });

  it('status "respondendo" popula respondido_por e respondido_em', async () => {
    const res = await request(app)
      .put(`/api/fila/tickets/${ticketId}/status`)
      .set(authHeaders(token))
      .send({ status: 'respondendo' });

    expect(res.status).toBe(200);
    expect(res.body.respondido_por).toBeTruthy();
    expect(res.body.respondido_em).toBeTruthy();
  });

  it('status inválido → 400', async () => {
    const res = await request(app)
      .put(`/api/fila/tickets/${ticketId}/status`)
      .set(authHeaders(token))
      .send({ status: 'status_que_nao_existe' });
    expect(res.status).toBe(400);
  });

  it('sem status no body → 400', async () => {
    const res = await request(app)
      .put(`/api/fila/tickets/${ticketId}/status`)
      .set(authHeaders(token))
      .send({});
    expect(res.status).toBe(400);
  });

  it('mudança de status gera entrada "status_alterado" no histórico', async () => {
    await request(app)
      .put(`/api/fila/tickets/${ticketId}/status`)
      .set(authHeaders(token))
      .send({ status: 'resolvido' });

    const hist = await request(app)
      .get(`/api/fila/tickets/${ticketId}/historico`)
      .set(authHeaders(token));

    const acoes = hist.body.historico.map((h) => h.acao);
    expect(acoes).toContain('status_alterado');
  });

  it('cliente 2 não altera status de ticket do cliente 1 → 403', async () => {
    const res = await request(app)
      .put(`/api/fila/tickets/${ticketId}/status`)
      .set(authHeaders(tokenC2))
      .send({ status: 'resolvido' });
    expect(res.status).toBe(403);
  });
});

// ── Ticket: Satisfação ────────────────────────────────────────────────────

describe('Fila — Ticket: Satisfação', () => {
  let token;
  let ticketId;

  beforeAll(async () => {
    token = await loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha);
    ticketId = await criarTicket(token, CLIENTE_IDS.C1, TICKET_TELEFONES.SAT);
  });

  afterAll(async () => {
    await sequelize.query(
      `DELETE FROM fila_mensagens WHERE telefone LIKE :pattern`,
      { replacements: { pattern: TICKET_PATTERN } }
    );
  });

  it('POST /satisfacao adiciona rating 5 → 200', async () => {
    const res = await request(app)
      .post(`/api/fila/tickets/${ticketId}/satisfacao`)
      .set(authHeaders(token))
      .send({ rating: 5 });

    expect(res.status).toBe(200);
    expect(res.body.satisfaction_rating).toBe(5);
  });

  it('rating 1 (mínimo) é válido', async () => {
    const res = await request(app)
      .post(`/api/fila/tickets/${ticketId}/satisfacao`)
      .set(authHeaders(token))
      .send({ rating: 1 });
    expect(res.status).toBe(200);
  });

  it('rating 0 → 400', async () => {
    const res = await request(app)
      .post(`/api/fila/tickets/${ticketId}/satisfacao`)
      .set(authHeaders(token))
      .send({ rating: 0 });
    expect(res.status).toBe(400);
  });

  it('rating 6 → 400', async () => {
    const res = await request(app)
      .post(`/api/fila/tickets/${ticketId}/satisfacao`)
      .set(authHeaders(token))
      .send({ rating: 6 });
    expect(res.status).toBe(400);
  });

  it('rating string → 400', async () => {
    const res = await request(app)
      .post(`/api/fila/tickets/${ticketId}/satisfacao`)
      .set(authHeaders(token))
      .send({ rating: 'cinco' });
    expect(res.status).toBe(400);
  });

  it('satisfação registra entrada "rating_adicionado" no histórico', async () => {
    await request(app)
      .post(`/api/fila/tickets/${ticketId}/satisfacao`)
      .set(authHeaders(token))
      .send({ rating: 4 });

    const hist = await request(app)
      .get(`/api/fila/tickets/${ticketId}/historico`)
      .set(authHeaders(token));

    const acoes = hist.body.historico.map((h) => h.acao);
    expect(acoes).toContain('rating_adicionado');
  });

  it('cliente 2 não avalia ticket do cliente 1 → 403', async () => {
    const res = await request(app)
      .post(`/api/fila/tickets/${ticketId}/satisfacao`)
      .set(authHeaders(tokenC2))
      .send({ rating: 3 });
    expect(res.status).toBe(403);
  });
});
