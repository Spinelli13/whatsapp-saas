'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

// Bruno existe no seed de cliente 1 (id=3), mas seu status pode ser offline
const BRUNO = { email: 'bruno@cliente1.com', senha: 'password123' };

let tokenAdmin;
let tokenAna;
let tokenBruno;
let atendimentoId;

beforeAll(async () => {
  tokenAdmin = await loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha);
  tokenAna   = await loginUser(CREDENTIALS.ATENDENTE_C1.email, CREDENTIALS.ATENDENTE_C1.senha);
  tokenBruno = await loginUser(BRUNO.email, BRUNO.senha);

  // Garantir que Ana e Bruno estejam online para poder receber transferências
  // (status-atendente.test.js pode ter deixado Ana em offline/ausente)
  await sequelize.query(
    `UPDATE usuarios SET status_atendente = 'online' WHERE email IN ('${CREDENTIALS.ATENDENTE_C1.email}', '${BRUNO.email}') AND cliente_id = 1`
  );

  // Criar um atendimento real
  const res = await request(app)
    .post('/api/atendimento/receber')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ numero: '5585996001001', mensagem: 'TESTE_transferencia inicio' });

  atendimentoId = res.body.atendimento?.id || res.body.id;
});

afterAll(async () => {
  await sequelize.query(`DELETE FROM transferencias WHERE atendimento_id IN (SELECT id FROM atendimentos WHERE numero_whatsapp = '5585996001001')`);
  await sequelize.query(`DELETE FROM atendimentos WHERE numero_whatsapp = '5585996001001'`);
  // Restaura status original: Bruno offline (seed), Ana online (seed)
  await sequelize.query(`UPDATE usuarios SET status_atendente = 'offline' WHERE email = '${BRUNO.email}'`);
  await sequelize.query(`UPDATE usuarios SET status_atendente = 'online' WHERE email = '${CREDENTIALS.ATENDENTE_C1.email}'`);
});

// ── Auth ─────────────────────────────────────────────────────────────────────

describe('Auth — Transferência requer autenticação', () => {
  it('GET /api/transferencia retorna 401 sem token', async () => {
    const res = await request(app).get('/api/transferencia');
    expect(res.status).toBe(401);
  });

  it('POST /api/transferencia/solicitar retorna 401 sem token', async () => {
    const res = await request(app).post('/api/transferencia/solicitar').send({});
    expect(res.status).toBe(401);
  });
});

// ── Validações ────────────────────────────────────────────────────────────────

describe('Validações — Campos obrigatórios', () => {
  it('POST /solicitar sem body retorna 400', async () => {
    const res = await request(app)
      .post('/api/transferencia/solicitar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatório/i);
  });

  it('POST /solicitar sem atendente_destino_id retorna 400', async () => {
    const res = await request(app)
      .post('/api/transferencia/solicitar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ atendimento_id: atendimentoId });

    expect(res.status).toBe(400);
  });

  it('POST /solicitar para si mesmo retorna 400', async () => {
    if (!atendimentoId) return;

    // Admin (id=1) tentando transferir para si mesmo
    const res = await request(app)
      .post('/api/transferencia/solicitar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ atendimento_id: atendimentoId, atendente_destino_id: 1 });

    expect(res.status).toBe(400);
    const mensagem = res.body.erro || res.body.error || '';
    expect(mensagem).toMatch(/si mesmo/i);
  });
});

// ── Fluxo completo ─────────────────────────────────────────────────────────────

describe('Fluxo completo — Solicitar → Aceitar', () => {
  let transferenciaId;

  it('POST /solicitar cria transferência pendente', async () => {
    if (!atendimentoId) return;

    // Admin (id=1) → Bruno (id=3)
    const res = await request(app)
      .post('/api/transferencia/solicitar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        atendimento_id: atendimentoId,
        atendente_destino_id: 3, // Bruno
        motivo: 'TESTE_motivo transferencia',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pendente');
    expect(res.body.data.atendimento_id).toBe(atendimentoId);
    transferenciaId = res.body.data.id;
  });

  it('POST /solicitar duplicada retorna 409', async () => {
    if (!atendimentoId || !transferenciaId) return;

    const res = await request(app)
      .post('/api/transferencia/solicitar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ atendimento_id: atendimentoId, atendente_destino_id: 3 });

    expect(res.status).toBe(409);
  });

  it('GET /pendentes retorna a transferência para Bruno', async () => {
    if (!transferenciaId) return;

    const res = await request(app)
      .get('/api/transferencia/pendentes')
      .set('Authorization', `Bearer ${tokenBruno}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const t = res.body.data.find((x) => x.id === transferenciaId);
    expect(t).toBeDefined();
    expect(t.status).toBe('pendente');
  });

  it('PATCH /:id/aceitar — Bruno aceita e assume o atendimento', async () => {
    if (!transferenciaId) return;

    const res = await request(app)
      .patch(`/api/transferencia/${transferenciaId}/aceitar`)
      .set('Authorization', `Bearer ${tokenBruno}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('aceita');
  });

  it('Atendimento deve estar atribuído ao Bruno após aceitar', async () => {
    if (!atendimentoId) return;

    const [rows] = await sequelize.query(
      `SELECT usuario_id FROM atendimentos WHERE id = '${atendimentoId}'`
    );
    expect(rows[0].usuario_id).toBe(3); // Bruno id=3
  });
});

// ── Fluxo rejeitar ────────────────────────────────────────────────────────────

describe('Fluxo — Solicitar → Rejeitar', () => {
  let transferenciaId2;

  it('POST /solicitar cria segunda transferência', async () => {
    if (!atendimentoId) return;

    const res = await request(app)
      .post('/api/transferencia/solicitar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        atendimento_id: atendimentoId,
        atendente_destino_id: 2, // Ana (id=2)
        motivo: 'TESTE_rejeitar',
      });

    expect(res.status).toBe(201);
    transferenciaId2 = res.body.data.id;
  });

  it('PATCH /:id/rejeitar — Ana rejeita com motivo', async () => {
    if (!transferenciaId2) return;

    const res = await request(app)
      .patch(`/api/transferencia/${transferenciaId2}/rejeitar`)
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({ motivo: 'Estou sobrecarregada' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rejeitada');
    expect(res.body.data.mensagem_rejeicao).toBe('Estou sobrecarregada');
  });
});

// ── Fluxo cancelar ─────────────────────────────────────────────────────────────

describe('Fluxo — Solicitar → Cancelar', () => {
  let transferenciaId3;

  it('POST /solicitar cria terceira transferência', async () => {
    if (!atendimentoId) return;

    const res = await request(app)
      .post('/api/transferencia/solicitar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        atendimento_id: atendimentoId,
        atendente_destino_id: 2, // Ana
        motivo: 'TESTE_cancelar',
      });

    expect(res.status).toBe(201);
    transferenciaId3 = res.body.data.id;
  });

  it('PATCH /:id/cancelar — admin cancela a própria transferência', async () => {
    if (!transferenciaId3) return;

    const res = await request(app)
      .patch(`/api/transferencia/${transferenciaId3}/cancelar`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelada');
  });
});

// ── Listar ────────────────────────────────────────────────────────────────────

describe('Listagem', () => {
  it('GET / retorna array de transferências do cliente', async () => {
    const res = await request(app)
      .get('/api/transferencia')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /?status=aceita filtra por status', async () => {
    const res = await request(app)
      .get('/api/transferencia?status=aceita')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((t) => expect(t.status).toBe('aceita'));
  });
});

// ── Permissões ─────────────────────────────────────────────────────────────────

describe('Permissões — Terceiro não pode aceitar/rejeitar', () => {
  it('PATCH /aceitar por usuário errado retorna 403', async () => {
    if (!atendimentoId) return;

    // Cria uma transferência para Bruno (id=3)
    const criar = await request(app)
      .post('/api/transferencia/solicitar')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ atendimento_id: atendimentoId, atendente_destino_id: 3 });

    if (criar.status !== 201) return;
    const tid = criar.body.data.id;

    // Ana (id=2) não é o destino → 403
    const res = await request(app)
      .patch(`/api/transferencia/${tid}/aceitar`)
      .set('Authorization', `Bearer ${tokenAna}`);

    expect(res.status).toBe(403);

    // Limpa
    await request(app)
      .patch(`/api/transferencia/${tid}/cancelar`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
  });
});

// ── Isolamento multi-tenant ───────────────────────────────────────────────────

describe('Isolamento — Cliente C2 não vê transferências de C1', () => {
  it('GET /pendentes de C2 não traz pendentes de C1', async () => {
    const tokenAdminC2 = await loginUser('admin@barcos.com', 'password123');

    const res = await request(app)
      .get('/api/transferencia/pendentes')
      .set('Authorization', `Bearer ${tokenAdminC2}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Nenhum pendente deve pertencer ao cliente 1
    res.body.data.forEach((t) => expect(t.cliente_id).not.toBe(1));
  });
});
