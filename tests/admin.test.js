'use strict';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app } = require('../src/backend/server');
const {
  sequelize,
  Cliente,
  ClientePlano,
  ClienteModulos,
  Plano,
  Modulo,
  Usuario,
  PermissaoModulo,
  SolicitacaoUpgrade,
} = require('../src/backend/models');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

const PREFIX = '__TEST_ADMIN__';

let masterToken;
let adminToken;
let clienteId;
let modWhatsappId;
let modAnalyticsId;

beforeAll(async () => {
  masterToken = await loginUser(CREDENTIALS.MASTER.email, CREDENTIALS.MASTER.senha);

  const cliente = await Cliente.create({
    nome: `${PREFIX} Cliente`,
    email: `${PREFIX.toLowerCase()}_cliente@example.com`,
  });
  clienteId = cliente.id;

  const planoBasico = await Plano.findOne({ where: { nome: 'Básico' } });
  await ClientePlano.create({
    cliente_id: clienteId,
    plano_id: planoBasico.id,
    status: 'ativo',
    data_proxima_renovacao: new Date(Date.now() + 30 * 86400000),
  });

  const modWhatsapp = await Modulo.findOne({ where: { nome: 'whatsapp' } });
  const modAnalytics = await Modulo.findOne({ where: { nome: 'analytics' } });
  modWhatsappId = modWhatsapp.id;
  modAnalyticsId = modAnalytics.id;
  await ClienteModulos.create({ cliente_id: clienteId, modulo_id: modWhatsapp.id });

  const adminEmail = `${PREFIX.toLowerCase()}_admin@example.com`;
  const senhaHash = await bcrypt.hash('senhaAdmin123', 10);
  await Usuario.create({
    nome: 'Admin Teste',
    email: adminEmail,
    senha: senhaHash,
    cliente_id: clienteId,
    role: 'admin',
    status: 'ativo',
  });
  adminToken = await loginUser(adminEmail, 'senhaAdmin123');
});

afterAll(async () => {
  const usuarios = await Usuario.findAll({ where: { cliente_id: clienteId } });
  const usuarioIds = usuarios.map((u) => u.id);
  if (usuarioIds.length) {
    await PermissaoModulo.destroy({ where: { usuario_id: usuarioIds } });
  }
  await SolicitacaoUpgrade.destroy({ where: { cliente_id: clienteId } });
  await Usuario.destroy({ where: { cliente_id: clienteId } });
  await ClienteModulos.destroy({ where: { cliente_id: clienteId } });
  await ClientePlano.destroy({ where: { cliente_id: clienteId } });
  await Cliente.destroy({ where: { id: clienteId } });
  await sequelize.close();
});

describe('Auth guard', () => {
  it('rejeita requisição sem token', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });

  it('rejeita master (role errado para rotas de admin)', async () => {
    const res = await request(app).get('/api/admin/dashboard').set(authHeaders(masterToken));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/dashboard', () => {
  it('retorna cliente, plano ativo e módulo contratado', async () => {
    const res = await request(app).get('/api/admin/dashboard').set(authHeaders(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.cliente.id).toBe(clienteId);
    expect(res.body.plano_atual.nome).toBe('Básico');
    expect(res.body.modulos_contratados.map((m) => m.nome)).toEqual(['whatsapp']);
  });
});

describe('GET /api/admin/modulos-contratados', () => {
  it('lista apenas o módulo contratado', async () => {
    const res = await request(app).get('/api/admin/modulos-contratados').set(authHeaders(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.modulos[0].nome).toBe('whatsapp');
  });
});

describe('Solicitações de upgrade', () => {
  let solicitacaoId;

  it('rejeita solicitação sem modulo_id', async () => {
    const res = await request(app).post('/api/admin/solicitar-modulo').set(authHeaders(adminToken)).send({});
    expect(res.status).toBe(400);
  });

  it('solicita módulo não contratado', async () => {
    const res = await request(app)
      .post('/api/admin/solicitar-modulo')
      .set(authHeaders(adminToken))
      .send({ modulo_id: modAnalyticsId });

    expect(res.status).toBe(201);
    solicitacaoId = res.body.solicitacao.id;
  });

  it('rejeita solicitar módulo já contratado', async () => {
    const res = await request(app)
      .post('/api/admin/solicitar-modulo')
      .set(authHeaders(adminToken))
      .send({ modulo_id: modWhatsappId });

    expect(res.status).toBe(409);
  });

  it('lista minhas solicitações e encontra a criada', async () => {
    const res = await request(app).get('/api/admin/minhas-solicitacoes').set(authHeaders(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.solicitacoes.some((s) => s.id === solicitacaoId)).toBe(true);
  });
});

describe('CRUD /api/admin/atendentes + permissões', () => {
  const atendenteEmail = `${PREFIX.toLowerCase()}_atendente@example.com`;
  let novoAtendenteId;

  it('rejeita senha curta', async () => {
    const res = await request(app)
      .post('/api/admin/atendentes')
      .set(authHeaders(adminToken))
      .send({ nome: 'Atendente Teste', email: atendenteEmail, senha: '123' });

    expect(res.status).toBe(400);
    expect(res.body.campo).toBe('senha');
  });

  it('cria atendente com permissão de módulo', async () => {
    const res = await request(app)
      .post('/api/admin/atendentes')
      .set(authHeaders(adminToken))
      .send({
        nome: 'Atendente Teste',
        email: atendenteEmail,
        senha: 'senhaValida123',
        modulos: [modWhatsappId],
      });

    expect(res.status).toBe(201);
    expect(res.body.atendente.senha).toBeUndefined();
    novoAtendenteId = res.body.atendente.id;
  });

  it('rejeita email duplicado dentro do mesmo cliente', async () => {
    const res = await request(app)
      .post('/api/admin/atendentes')
      .set(authHeaders(adminToken))
      .send({ nome: 'Outro', email: atendenteEmail, senha: 'senhaValida123' });

    expect(res.status).toBe(409);
  });

  it('lista atendentes incluindo o novo, com permissões', async () => {
    const res = await request(app).get('/api/admin/atendentes').set(authHeaders(adminToken));

    expect(res.status).toBe(200);
    const criado = res.body.atendentes.find((a) => a.id === novoAtendenteId);
    expect(criado).toBeDefined();
    expect(criado.permissoesModulo.length).toBe(1);
  });

  it('obtém permissões do atendente', async () => {
    const res = await request(app)
      .get(`/api/admin/atendentes/${novoAtendenteId}/permissoes`)
      .set(authHeaders(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.modulos.map((m) => m.nome)).toEqual(['whatsapp']);
  });

  it('redefine permissões do atendente para nenhuma', async () => {
    const res = await request(app)
      .post(`/api/admin/atendentes/${novoAtendenteId}/permissoes`)
      .set(authHeaders(adminToken))
      .send({ modulos: [] });

    expect(res.status).toBe(200);
    expect(res.body.modulos_concedidos).toBe(0);
  });

  it('atualiza nome do atendente', async () => {
    const res = await request(app)
      .put(`/api/admin/atendentes/${novoAtendenteId}`)
      .set(authHeaders(adminToken))
      .send({ nome: 'Atendente Atualizado' });

    expect(res.status).toBe(200);
    expect(res.body.atendente.nome).toBe('Atendente Atualizado');
  });

  it('deleta (soft) o atendente', async () => {
    const res = await request(app).delete(`/api/admin/atendentes/${novoAtendenteId}`).set(authHeaders(adminToken));
    expect(res.status).toBe(200);

    const atendente = await Usuario.findByPk(novoAtendenteId);
    expect(atendente.status).toBe('inativo');
  });
});
