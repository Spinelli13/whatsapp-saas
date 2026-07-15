const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Cliente, DispositivoUsuario, SessaoUsuario } = require('../models');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET } = require('../config/environment');

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

async function criarSessao(usuario_id, device_id, user_agent, ip_address) {
  const usuario = await Usuario.findByPk(usuario_id);
  if (!usuario) throw new Error('Usuário não encontrado');

  const [dispositivo] = await DispositivoUsuario.findOrCreate({
    where: { usuario_id, device_id: String(device_id) },
    defaults: {
      nome: `Dispositivo ${new Date().toLocaleDateString('pt-BR')}`,
      user_agent,
      ip_address,
      ultimo_acesso: new Date(),
    },
  });

  await dispositivo.update({ ultimo_acesso: new Date(), user_agent, ip_address });

  const refreshToken = jwt.sign(
    { usuario_id, dispositivo_id: dispositivo.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  await SessaoUsuario.create({
    usuario_id,
    token_refresh: refreshToken,
    dispositivo_id: dispositivo.id,
    expira_em: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ativa: true,
  });

  const accessToken = jwt.sign(
    { id: usuario.id, email: usuario.email, cliente_id: usuario.cliente_id, role: usuario.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { accessToken, refreshToken, expiresIn: 86400 };
}

async function refresharToken(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Refresh token inválido'), { status: 401 });
  }

  const sessao = await SessaoUsuario.findOne({ where: { token_refresh: refreshToken, ativa: true } });
  if (!sessao || sessao.expira_em < new Date()) {
    throw Object.assign(new Error('Sessão inválida ou expirada'), { status: 401 });
  }

  const usuario = await Usuario.findByPk(payload.usuario_id);
  if (!usuario) throw Object.assign(new Error('Usuário não encontrado'), { status: 401 });

  const accessToken = jwt.sign(
    { id: usuario.id, email: usuario.email, cliente_id: usuario.cliente_id, role: usuario.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { accessToken, expiresIn: 86400 };
}

async function encerrarSessao(refreshToken) {
  if (!refreshToken) return true;
  await SessaoUsuario.update({ ativa: false }, { where: { token_refresh: refreshToken } });
  return true;
}

module.exports = { register, login, validarToken, criarSessao, refresharToken, encerrarSessao };
