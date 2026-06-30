const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario, Cliente } = require('../models');
const { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } = require('../config/environment');

const BCRYPT_ROUNDS = 10;

// ─────────────────────────────────────────────────────────────
// MOCK - REMOVER EM 2.3
// TODO: Quando PostgreSQL estiver pronto (FASE 2.3):
//   1. Deletar o bloco MOCK_USERS abaixo
//   2. Deletar as funções loginMock() e getMockToken()
//   3. Ver docs/MOCK-AUTH-TEMPORARIO.md para checklist completo
// ─────────────────────────────────────────────────────────────
const MOCK_USERS = [
  {
    id: 1,
    nome: 'Admin Cliente 1',
    email: 'admin@cliente1.com',
    senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
    role: 'admin',
    cliente_id: 1,
    status: 'ativo',
  },
  {
    id: 2,
    nome: 'Atendente Cliente 1',
    email: 'atendente@cliente1.com',
    senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
    role: 'atendente',
    cliente_id: 1,
    status: 'ativo',
  },
  {
    id: 3,
    nome: 'Admin Barcos',
    email: 'admin@barcos.com',
    senha: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
    role: 'admin',
    cliente_id: 2,
    status: 'ativo',
  },
];
// ─────────────────────────────────────────────────────────────
// FIM MOCK
// ─────────────────────────────────────────────────────────────

// ── Funções de produção (manter para sempre) ─────────────────

async function register({ nome, email, senha, cliente_id, role = 'atendente' }) {
  if (!senha || senha.length < 6) {
    const err = new Error('Senha deve ter no mínimo 6 caracteres');
    err.status = 400;
    throw err;
  }

  const cliente = await Cliente.findByPk(cliente_id);
  if (!cliente || cliente.status !== 'ativo') {
    const err = new Error('Cliente não encontrado ou inativo');
    err.status = 400;
    throw err;
  }

  const existente = await Usuario.findOne({ where: { email } });
  if (existente) {
    const err = new Error('Email já está em uso');
    err.status = 409;
    throw err;
  }

  const senha_hash = await bcrypt.hash(senha, BCRYPT_ROUNDS);
  const usuario = await Usuario.create({ nome, email, senha: senha_hash, cliente_id, role });
  return _payload(usuario);
}

async function login({ email, senha }) {
  const usuario = await Usuario.findOne({ where: { email } });

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    const err = new Error('Credenciais inválidas');
    err.status = 401;
    throw err;
  }

  if (usuario.status !== 'ativo') {
    const err = new Error('Usuário inativo');
    err.status = 403;
    throw err;
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, cliente_id: usuario.cliente_id, role: usuario.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { token, usuario: _payload(usuario) };
}

function validarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function _payload(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    cliente_id: usuario.cliente_id,
    status: usuario.status,
  };
}

// ─────────────────────────────────────────────────────────────
// MOCK - REMOVER EM 2.3
// loginMock: login com usuário fictício sem banco
// Bloqueado em production. Usar apenas para testes locais.
// ─────────────────────────────────────────────────────────────
async function loginMock({ email, senha }) {
  if (NODE_ENV === 'production') {
    const err = new Error('Endpoint indisponível em produção');
    err.status = 404;
    throw err;
  }

  const usuario = MOCK_USERS.find((u) => u.email === email);

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    const err = new Error('Credenciais inválidas (mock)');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, cliente_id: usuario.cliente_id, role: usuario.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { token, usuario: _payload(usuario), mock: true };
}

// MOCK - REMOVER EM 2.3
// getMockToken: retorna token sem senha (conveniência para curl/browser)
// Parâmetro clienteId 1 → admin@cliente1.com / 2 → admin@barcos.com
function getMockToken(clienteId = 1) {
  if (NODE_ENV === 'production') {
    const err = new Error('Endpoint indisponível em produção');
    err.status = 404;
    throw err;
  }

  const usuario = MOCK_USERS.find((u) => u.cliente_id === clienteId && u.role === 'admin');

  if (!usuario) {
    const err = new Error(`Nenhum usuário mock para cliente_id=${clienteId}`);
    err.status = 404;
    throw err;
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, cliente_id: usuario.cliente_id, role: usuario.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { token, usuario: _payload(usuario), mock: true };
}
// ─────────────────────────────────────────────────────────────
// FIM MOCK
// ─────────────────────────────────────────────────────────────

module.exports = { register, login, loginMock, getMockToken, validarToken };
