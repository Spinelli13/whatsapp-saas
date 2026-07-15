'use strict';

const PlanoService = require('../services/planoService');

// Pass through gracefully if the client has no plan (backward compat).
async function _getLimites(cliente_id) {
  try {
    return await PlanoService.verificarLimites(cliente_id);
  } catch {
    return null;
  }
}

const verificarLimiteMensagens = async (req, res, next) => {
  try {
    const limites = await _getLimites(req.usuario.cliente_id);
    if (limites && limites.mensagens.atingiu) {
      return res.status(402).json({ error: 'Limite de mensagens atingido', limites });
    }
    next();
  } catch (err) {
    next(err);
  }
};

const verificarLimiteUsuarios = async (req, res, next) => {
  try {
    const limites = await _getLimites(req.usuario.cliente_id);
    if (limites && limites.usuarios.atingiu) {
      return res.status(402).json({ error: 'Limite de usuários atingido', limites });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { verificarLimiteMensagens, verificarLimiteUsuarios };
