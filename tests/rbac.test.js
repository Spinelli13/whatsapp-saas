'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { JWT_SECRET } = require('../src/backend/config/environment');
const { loginUser, authHeaders } = require('./helpers/auth.helper');

// ── Token helpers ────────────────────────────────────────────────────────────

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Admin C1 with RBAC role_id=1 (seed: admin, cliente_id=1, all perms)
function adminToken() {
  return makeToken({ id: 1, email: 'admin@cliente1.com', cliente_id: 1, role: 'admin', role_id: 1 });
}

// Visualizador C1 with RBAC role_id=4 (seed: visualizador, has fila.visualizar only)
function visualizadorToken() {
  return makeToken({ id: 2, email: 'ana@cliente1.com', cliente_id: 1, role: 'atendente', role_id: 4 });
}

// Legacy admin C1 WITHOUT role_id — backward compat
function legacyAdminToken() {
  return makeToken({ id: 1, email: 'admin@cliente1.com', cliente_id: 1, role: 'admin' });
}

// ── Cleanup helpers ──────────────────────────────────────────────────────────

async function deleteRoleByNome(nome, cliente_id) {
  await sequelize.query(
    `DELETE FROM roles WHERE nome = :nome AND cliente_id = :cliente_id`,
    { replacements: { nome, cliente_id } }
  );
}

// ── Test suites ──────────────────────────────────────────────────────────────

describe('RBAC — GET /api/roles (lista roles)', () => {
  it('admin com role_id deve receber lista de roles do cliente', async () => {
    const res = await request(app)
      .get('/api/roles')
      .set(authHeaders(adminToken()));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('roles');
    expect(Array.isArray(res.body.roles)).toBe(true);
    // Seed criou 4 roles para cliente_id=1
    expect(res.body.roles.length).toBeGreaterThanOrEqual(4);
  });

  it('visualizador não tem configuracoes.permissoes → 403', async () => {
    const res = await request(app)
      .get('/api/roles')
      .set(authHeaders(visualizadorToken()));

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('erro');
  });

  it('token legacy (sem role_id) passa por verificarPermissao → 200', async () => {
    const res = await request(app)
      .get('/api/roles')
      .set(authHeaders(legacyAdminToken()));

    // verificarPermissao faz next() para tokens sem role_id (backward compat)
    expect(res.status).toBe(200);
  });
});

describe('RBAC — GET /api/roles/permissoes/listar', () => {
  it('retorna permissões agrupadas por categoria', async () => {
    const res = await request(app)
      .get('/api/roles/permissoes/listar')
      .set(authHeaders(adminToken()));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('por_categoria');
    const cats = Object.keys(res.body.por_categoria);
    expect(cats).toContain('fila');
    expect(cats).toContain('notas');
    expect(cats).toContain('configuracoes');
  });
});

describe('RBAC — POST /api/roles (criar role)', () => {
  afterAll(async () => {
    await deleteRoleByNome('moderador', 1);
  });

  it('admin cria role customizado', async () => {
    const res = await request(app)
      .post('/api/roles')
      .set(authHeaders(adminToken()))
      .send({ nome: 'moderador', descricao: 'Moderador de testes', eh_customizado: true });

    expect(res.status).toBe(201);
    expect(res.body.role).toMatchObject({ nome: 'moderador', cliente_id: 1 });
  });

  it('criação sem nome retorna 400', async () => {
    const res = await request(app)
      .post('/api/roles')
      .set(authHeaders(adminToken()))
      .send({ descricao: 'sem nome' });

    expect(res.status).toBe(400);
  });
});

describe('RBAC — GET /api/roles/:id', () => {
  it('admin obtém role pelo id', async () => {
    const res = await request(app)
      .get('/api/roles/1')
      .set(authHeaders(adminToken()));

    expect(res.status).toBe(200);
    expect(res.body.role).toMatchObject({ id: 1, cliente_id: 1, nome: 'admin' });
    expect(res.body.role).toHaveProperty('Permissaos');
    expect(Array.isArray(res.body.role.Permissaos)).toBe(true);
  });

  it('role de outro cliente retorna 404', async () => {
    // role_id=5 pertence a cliente_id=2
    const res = await request(app)
      .get('/api/roles/5')
      .set(authHeaders(adminToken()));

    expect(res.status).toBe(404);
  });
});

describe('RBAC — POST/DELETE /api/roles/:role_id/permissoes/:permissao_id', () => {
  let novoRoleId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/roles')
      .set(authHeaders(adminToken()))
      .send({ nome: 'novo_role', descricao: 'Role para testes de permissão', eh_customizado: true });
    novoRoleId = res.body.role.id;
  });

  afterAll(async () => {
    await deleteRoleByNome('novo_role', 1);
  });

  it('adiciona permissão (fila.reabrir = id 5) à role criada', async () => {
    const res = await request(app)
      .post(`/api/roles/${novoRoleId}/permissoes/5`)
      .set(authHeaders(adminToken()));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('mensagem');
  });

  it('remove permissão da role', async () => {
    const res = await request(app)
      .delete(`/api/roles/${novoRoleId}/permissoes/5`)
      .set(authHeaders(adminToken()));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('mensagem');
  });
});

describe('RBAC — fila routes com verificarPermissao (backward compat)', () => {
  it('GET /api/fila/status/:id com token legacy (sem role_id) → 200', async () => {
    const tokenLegacy = await loginUser('admin@cliente1.com', 'password123');
    const res = await request(app)
      .get('/api/fila/status/1')
      .set(authHeaders(tokenLegacy));

    expect(res.status).toBe(200);
  });

  it('GET /api/fila/status/:id com role_id de visualizador (tem fila.visualizar) → 200', async () => {
    const res = await request(app)
      .get('/api/fila/status/1')
      .set(authHeaders(visualizadorToken()));

    expect(res.status).toBe(200);
  });
});
