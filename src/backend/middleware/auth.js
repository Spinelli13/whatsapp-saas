const { validarToken } = require('../services/authService');

function verificarJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.usuario = validarToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function autorizarClienteId(req, res, next) {
  const clienteIdParam = parseInt(req.params.cliente_id || req.body.cliente_id, 10);

  if (clienteIdParam && clienteIdParam !== req.usuario.cliente_id) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  next();
}

function apenasAdmin(req, res, next) {
  if (req.usuario.role !== 'admin') {
    return res.status(403).json({ error: 'Requer privilégio de admin' });
  }
  next();
}

module.exports = { verificarJWT, autorizarClienteId, apenasAdmin };
