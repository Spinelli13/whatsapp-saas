const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Cliente } = require('../models');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/environment');

const BCRYPT_ROUNDS = 10;

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

module.exports = { register, login, validarToken };
