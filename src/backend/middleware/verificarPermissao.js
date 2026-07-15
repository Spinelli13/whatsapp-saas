'use strict';

const { Role, Permissao } = require('../models');

/**
 * Returns Express middleware that checks whether the authenticated user
 * has the given permission.
 *
 * Backward-compat: JWT tokens issued before RBAC (no role_id field) are
 * allowed through automatically so existing endpoints keep working.
 */
function verificarPermissao(permissaoNecessaria) {
  return async (req, res, next) => {
    try {
      const usuario = req.usuario;

      if (!usuario) {
        return res.status(401).json({ erro: 'Não autenticado' });
      }

      // Legacy tokens without role_id → pass through (backward compat)
      if (!usuario.role_id) {
        return next();
      }

      const role = await Role.findOne({
        where: { id: usuario.role_id, cliente_id: usuario.cliente_id },
        include: [
          {
            model: Permissao,
            as: 'Permissaos',
            where: { nome: permissaoNecessaria },
            required: false,
          },
        ],
      });

      if (!role) {
        return res.status(403).json({ erro: 'Role não encontrada' });
      }

      const temPermissao = role.Permissaos && role.Permissaos.length > 0;

      if (!temPermissao) {
        return res.status(403).json({ erro: 'Permissão negada', permissao: permissaoNecessaria });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = verificarPermissao;
