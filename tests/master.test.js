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
  SolicitacaoUpgrade,
} = require('../src/backend/models');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

const PREFIX = '__TEST_MASTER__';

let masterToken;
let clienteId;
let planoBasicoId;
let planoProId;

beforeAll(async () => {
  masterToken = await loginUser(CREDENTIALS.MASTER.email, CREDENTIALS.MASTER.senha);

  const planoBasico = await Plano.findOne({ where: { nome: 'Básico' } });
  const planoPro = await Plano.findOne({ where: { nome: 'Pro' } });
  planoBasicoId = planoBasico.id;
  planoProId = planoPro.id;
});

afterAll(async () => {
  if (clienteId) {
    await SolicitacaoUpgrade.destroy({ where: { cliente_id: clienteId } });
    await Usuario.destroy({ where: { cliente_id: clienteId } });
    await ClienteModulos.destroy({ where: { cliente_id: clienteId } });
    await ClientePlano.destroy({ where: { cliente_id: clienteId } });
  }
  await Cliente.destroy({ where: { nome: { [require('sequelize').Op.like]: `${PREFIX}%` } } });
  await Plano.destroy({ where: { nome: { [require('sequelize').Op.like]: `${PREFIX}%` } } });
  await sequelize.close();
});

describe('Auth guard', () => {
  it('rejeita requisição sem token', async () => {
    const res = await request(app).get('/api/master/dashboard');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/master/clientes', () => {
  it('rejeita nome curto', async () => {
    const res = await request(app)
      .post('/api/master/clientes')
      .set(authHeaders(masterToken))
      .send({ nome: 'AB', email: 'x@x.com' });

    expect(res.status).toBe(400);
    expect(res.body.campo).toBe('nome');
  });

  it('rejeita email inválido', async () => {
    const res = await request(app)
      .post('/api/master/clientes')
      .set(authHeaders(masterToken))
      .send({ nome: `${PREFIX} Nome Valido`, email: 'invalido' });

    expect(res.status).toBe(400);
    expect(res.body.campo).toBe('email');
  });

  it('cria cliente com sucesso', async () => {
    const res = await request(app)
      .post('/api/master/clientes')
      .set(authHeaders(masterToken))
      .send({ nome: `${PREFIX} Cliente`, email: `${PREFIX.toLowerCase()}_c1@example.com` });

    expect(res.status).toBe(201);
    expect(res.body.cliente.nome).toBe(`${PREFIX} Cliente`);
    clienteId = res.body.cliente.id;
  });

  it('rejeita email duplicado', async () => {
    const res = await request(app)
      .post('/api/master/clientes')
      .set(authHeaders(masterToken))
      .send({ nome: `${PREFIX} Cliente 2`, email: `${PREFIX.toLowerCase()}_c1@example.com` });

    expect(res.status).toBe(409);
  });
});

describe('PUT/GET /api/master/clientes', () => {
  it('atualiza cliente', async () => {
    const res = await request(app)
      .put(`/api/master/clientes/${clienteId}`)
      .set(authHeaders(masterToken))
      .send({ telefone: '11999999999' });

    expect(res.status).toBe(200);
    expect(res.body.cliente.telefone).toBe('11999999999');
  });

  it('retorna 404 para cliente inexistente', async () => {
    const res = await request(app)
      .put('/api/master/clientes/999999999')
      .set(authHeaders(masterToken))
      .send({ nome: 'X' });

    expect(res.status).toBe(404);
  });

  it('lista clientes e encontra o criado via busca', async () => {
    const res = await request(app)
      .get('/api/master/clientes')
      .query({ search: PREFIX })
      .set(authHeaders(masterToken));

    expect(res.status).toBe(200);
    expect(res.body.clientes.some((c) => c.id === clienteId)).toBe(true);
  });
});

describe('POST /api/master/atribuir-plano (com sync de módulos)', () => {
  it('atribui Básico e sincroniza 1 módulo (whatsapp)', async () => {
    const res = await request(app)
      .post('/api/master/atribuir-plano')
      .set(authHeaders(masterToken))
      .send({ cliente_id: clienteId, plano_id: planoBasicoId });

    expect(res.status).toBe(200);

    const modCount = await ClienteModulos.count({ where: { cliente_id: clienteId } });
    expect(modCount).toBe(1);
  });

  it('reatribuir para Pro troca os módulos para os 7 e cancela o plano anterior', async () => {
    const res = await request(app)
      .post('/api/master/atribuir-plano')
      .set(authHeaders(masterToken))
      .send({ cliente_id: clienteId, plano_id: planoProId });

    expect(res.status).toBe(200);

    const modCount = await ClienteModulos.count({ where: { cliente_id: clienteId } });
    expect(modCount).toBe(7);

    const ativos = await ClientePlano.count({ where: { cliente_id: clienteId, status: 'ativo' } });
    expect(ativos).toBe(1);

    const cancelados = await ClientePlano.count({ where: { cliente_id: clienteId, status: 'cancelado' } });
    expect(cancelados).toBe(1);
  });
});

describe('GET /api/master/clientes/:id/consumo', () => {
  it('retorna plano atual e módulos contratados', async () => {
    const res = await request(app)
      .get(`/api/master/clientes/${clienteId}/consumo`)
      .set(authHeaders(masterToken));

    expect(res.status).toBe(200);
    expect(res.body.plano_atual.nome).toBe('Pro');
    expect(res.body.modulos_contratados.length).toBe(7);
  });
});

describe('GET /api/master/dashboard', () => {
  it('inclui o cliente de teste na contagem', async () => {
    const res = await request(app).get('/api/master/dashboard').set(authHeaders(masterToken));

    expect(res.status).toBe(200);
    expect(res.body.total_clientes_ativos).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.receita_mensal_esperada).toBe('number');
  });
});

describe('CRUD /api/master/planos', () => {
  let planoTesteId;

  it('cria plano com módulos', async () => {
    const modulos = await Modulo.findAll({ limit: 1 });
    const res = await request(app)
      .post('/api/master/planos')
      .set(authHeaders(masterToken))
      .send({ nome: `${PREFIX} Plano`, preco_mensal: 123.45, modulos: [modulos[0].id] });

    expect(res.status).toBe(201);
    expect(res.body.plano.modulos.length).toBe(1);
    planoTesteId = res.body.plano.id;
  });

  it('rejeita nome de plano duplicado', async () => {
    const res = await request(app)
      .post('/api/master/planos')
      .set(authHeaders(masterToken))
      .send({ nome: `${PREFIX} Plano`, preco_mensal: 10 });

    expect(res.status).toBe(409);
  });

  it('lista planos incluindo o novo', async () => {
    const res = await request(app).get('/api/master/planos').set(authHeaders(masterToken));

    expect(res.status).toBe(200);
    expect(res.body.planos.some((p) => p.id === planoTesteId)).toBe(true);
  });

  it('atualiza preço do plano', async () => {
    const res = await request(app)
      .put(`/api/master/planos/${planoTesteId}`)
      .set(authHeaders(masterToken))
      .send({ preco_mensal: 200 });

    expect(res.status).toBe(200);
    expect(Number(res.body.plano.preco_mensal)).toBe(200);
  });

  it('deleta (soft) plano sem clientes ativos', async () => {
    const res = await request(app).delete(`/api/master/planos/${planoTesteId}`).set(authHeaders(masterToken));
    expect(res.status).toBe(200);
  });

  it('bloqueia deleção de plano com cliente ativo', async () => {
    const res = await request(app).delete(`/api/master/planos/${planoProId}`).set(authHeaders(masterToken));
    expect(res.status).toBe(409);
    expect(res.body.clientes_ativos).toBeGreaterThanOrEqual(1);
  });
});

describe('Ciclo de solicitações de upgrade (admin solicita, master decide)', () => {
  const adminEmail = `${PREFIX.toLowerCase()}_admin_solic@example.com`;
  let adminToken;
  let solicitacaoId;

  beforeAll(async () => {
    const senhaHash = await bcrypt.hash('senhaTeste123', 10);
    await Usuario.create({
      nome: 'Admin Solic',
      email: adminEmail,
      senha: senhaHash,
      cliente_id: clienteId,
      role: 'admin',
      status: 'ativo',
    });
    adminToken = await loginUser(adminEmail, 'senhaTeste123');
  });

  it('admin solicita mudança para o plano Básico (está no Pro)', async () => {
    const res = await request(app)
      .post('/api/admin/solicitar-plano')
      .set(authHeaders(adminToken))
      .send({ plano_id: planoBasicoId });

    expect(res.status).toBe(201);
    solicitacaoId = res.body.solicitacao.id;
  });

  it('master lista solicitações pendentes e encontra a criada', async () => {
    const res = await request(app)
      .get('/api/master/solicitacoes')
      .query({ status: 'pendente' })
      .set(authHeaders(masterToken));

    expect(res.status).toBe(200);
    expect(res.body.solicitacoes.some((s) => s.id === solicitacaoId)).toBe(true);
  });

  it('master aprova a solicitação e o plano do cliente muda', async () => {
    const res = await request(app)
      .post(`/api/master/solicitacoes/${solicitacaoId}/aprovar`)
      .set(authHeaders(masterToken));

    expect(res.status).toBe(200);
    expect(res.body.solicitacao.status).toBe('aprovado');

    const modCount = await ClienteModulos.count({ where: { cliente_id: clienteId } });
    expect(modCount).toBe(1); // Básico = whatsapp only
  });

  it('não permite processar a mesma solicitação duas vezes', async () => {
    const res = await request(app)
      .post(`/api/master/solicitacoes/${solicitacaoId}/recusar`)
      .set(authHeaders(masterToken))
      .send({ motivo_recusa: 'já processada' });

    expect(res.status).toBe(409);
  });
});
