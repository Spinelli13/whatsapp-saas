'use strict';

/**
 * Pure unit tests for verificarMaster / verificarAdmin.
 * No DB needed -- both are synchronous functions of req.usuario.
 */

const verificarMaster = require('../src/backend/middleware/verificarMaster');
const verificarAdmin = require('../src/backend/middleware/verificarAdmin');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
}

describe('verificarMaster', () => {
  it('permite role master', () => {
    const res = mockRes();
    const next = jest.fn();
    verificarMaster({ usuario: { id: 1, email: 'm@x.com', role: 'master' } }, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('retorna 401 sem req.usuario', () => {
    const res = mockRes();
    const next = jest.fn();
    verificarMaster({ usuario: null }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 403 para role diferente de master', () => {
    const res = mockRes();
    const next = jest.fn();
    verificarMaster({ usuario: { id: 1, role: 'admin' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ seu_role: 'admin' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('é case-sensitive ("Master" !== "master")', () => {
    const res = mockRes();
    const next = jest.fn();
    verificarMaster({ usuario: { id: 1, role: 'Master' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('verificarAdmin', () => {
  it('permite role admin com cliente_id definido', () => {
    const res = mockRes();
    const next = jest.fn();
    verificarAdmin({ usuario: { id: 2, email: 'a@x.com', role: 'admin', cliente_id: 5 } }, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('retorna 401 sem req.usuario', () => {
    const res = mockRes();
    const next = jest.fn();
    verificarAdmin({ usuario: null }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 403 para role diferente de admin', () => {
    const res = mockRes();
    const next = jest.fn();
    verificarAdmin({ usuario: { id: 3, role: 'atendente', cliente_id: 5 } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 500 quando admin não tem cliente_id (dado inconsistente)', () => {
    const res = mockRes();
    const next = jest.fn();
    verificarAdmin({ usuario: { id: 2, role: 'admin', cliente_id: null } }, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});
