'use strict';

/**
 * verificarModuloPermissao / verificarLimiteDepartamentos aren't mounted on
 * any route yet (they're meant for future feature routes, e.g.
 * /api/whatsapp or /api/admin/departamentos), so there's no HTTP path to
 * exercise them through. Calling them directly against the real DB, same
 * as the rest of this suite.
 */

const { sequelize, Cliente, ClientePlano, ClienteModulos, Plano, Modulo, Departamento } = require('../src/backend/models');
const verificarModuloPermissao = require('../src/backend/middleware/verificarModuloPermissao');
const verificarLimiteDepartamentos = require('../src/backend/middleware/verificarLimiteDepartamentos');

const PREFIX = '__TEST_MWMOD__';

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
}

let clienteId;

beforeAll(async () => {
  const cliente = await Cliente.create({ nome: `${PREFIX} Cliente`, email: `${PREFIX.toLowerCase()}@example.com` });
  clienteId = cliente.id;

  const planoBasico = await Plano.findOne({ where: { nome: 'Básico' } }); // departamentos_limite: 2
  await ClientePlano.create({
    cliente_id: clienteId,
    plano_id: planoBasico.id,
    status: 'ativo',
    data_proxima_renovacao: new Date(Date.now() + 30 * 86400000),
  });

  const modWhatsapp = await Modulo.findOne({ where: { nome: 'whatsapp' } });
  await ClienteModulos.create({ cliente_id: clienteId, modulo_id: modWhatsapp.id });
});

afterAll(async () => {
  await Departamento.destroy({ where: { cliente_id: clienteId } });
  await ClienteModulos.destroy({ where: { cliente_id: clienteId } });
  await ClientePlano.destroy({ where: { cliente_id: clienteId } });
  await Cliente.destroy({ where: { id: clienteId } });
  await sequelize.close();
});

describe('verificarModuloPermissao', () => {
  it('master sempre passa, sem consultar módulo', async () => {
    const res = mockRes();
    const next = jest.fn();
    await verificarModuloPermissao('whatsapp')({ usuario: { role: 'master', email: 'm@x.com' } }, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('admin com módulo contratado passa', async () => {
    const res = mockRes();
    const next = jest.fn();
    await verificarModuloPermissao('whatsapp')({ usuario: { role: 'admin', cliente_id: clienteId } }, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('admin sem módulo contratado recebe 403', async () => {
    const res = mockRes();
    const next = jest.fn();
    await verificarModuloPermissao('analytics')({ usuario: { role: 'admin', cliente_id: clienteId } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('módulo inexistente retorna 404', async () => {
    const res = mockRes();
    const next = jest.fn();
    await verificarModuloPermissao('nao_existe_xyz')({ usuario: { role: 'admin', cliente_id: clienteId } }, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('verificarLimiteDepartamentos', () => {
  it('master sempre passa, sem limite', async () => {
    const res = mockRes();
    const next = jest.fn();
    await verificarLimiteDepartamentos({ usuario: { role: 'master', email: 'm@x.com' } }, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('permite criar dentro do limite do plano (0/2)', async () => {
    const res = mockRes();
    const next = jest.fn();
    await verificarLimiteDepartamentos({ usuario: { role: 'admin', cliente_id: clienteId } }, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('bloqueia com 429 ao atingir o limite (2/2 do plano Básico)', async () => {
    await Departamento.create({ cliente_id: clienteId, nome: 'Dep1' });
    await Departamento.create({ cliente_id: clienteId, nome: 'Dep2' });

    const res = mockRes();
    const next = jest.fn();
    await verificarLimiteDepartamentos({ usuario: { role: 'admin', cliente_id: clienteId } }, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ limite: 2, atual: 2 }));
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 404 quando cliente não tem plano ativo', async () => {
    const semPlano = await Cliente.create({ nome: `${PREFIX} SemPlano`, email: `${PREFIX.toLowerCase()}_semplano@example.com` });
    const res = mockRes();
    const next = jest.fn();
    await verificarLimiteDepartamentos({ usuario: { role: 'admin', cliente_id: semPlano.id } }, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    await Cliente.destroy({ where: { id: semPlano.id } });
  });
});
