'use strict';

const { ClienteModulos, Modulo } = require('../models');

/**
 * Middleware: verificarModuloPermissao
 *
 * Higher-order middleware (returns a middleware)
 * Validates that user/client has access to a specific module
 *
 * Usage:
 *   router.post(
 *     '/api/analytics/relatorio',
 *     verificarModuloPermissao('analytics'),
 *     handler
 *   )
 *
 * Behavior:
 *   - Master: allowed (has access to everything)
 *   - Admin/Atendente: check ClienteModulos for this client + module
 *
 * Returns:
 *   200: next() → continue
 *   401: not authenticated
 *   403: module not contracted
 *   404: module does not exist
 *   500: database error
 */

const verificarModuloPermissao = (nomeModulo) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({ erro: 'Não autenticado' });
      }

      // Master tem acesso a tudo, sem validação de módulo
      if (req.usuario.role === 'master') {
        console.log(
          `[verificarModuloPermissao] Master ${req.usuario.email} acessando módulo '${nomeModulo}'`
        );
        return next();
      }

      if (!req.usuario.cliente_id) {
        return res.status(403).json({
          erro: 'Acesso negado',
          detalhes: 'Usuário sem cliente associado',
        });
      }

      const modulo = await Modulo.findOne({ where: { nome: nomeModulo } });

      if (!modulo) {
        return res.status(404).json({
          erro: 'Módulo não encontrado',
          modulo_solicitado: nomeModulo,
        });
      }

      const clienteTemAcesso = await ClienteModulos.findOne({
        where: {
          cliente_id: req.usuario.cliente_id,
          modulo_id: modulo.id,
        },
      });

      if (!clienteTemAcesso) {
        console.warn(
          `[verificarModuloPermissao] Cliente ${req.usuario.cliente_id} tentando acessar módulo '${nomeModulo}' sem permissão`
        );

        return res.status(403).json({
          erro: 'Acesso negado ao módulo',
          detalhes: `Seu plano não inclui o módulo '${nomeModulo}'`,
          modulo: nomeModulo,
          solucao: 'Solicite upgrade do seu plano para acessar este módulo',
        });
      }

      console.log(
        `[verificarModuloPermissao] Cliente ${req.usuario.cliente_id} autorizado para módulo '${nomeModulo}'`
      );

      req.modulo = modulo;

      next();
    } catch (erro) {
      console.error('[verificarModuloPermissao] Erro inesperado:', erro);
      return res.status(500).json({
        erro: 'Erro ao verificar acesso ao módulo',
        detalhes: process.env.NODE_ENV === 'development' ? erro.message : undefined,
      });
    }
  };
};

module.exports = verificarModuloPermissao;
