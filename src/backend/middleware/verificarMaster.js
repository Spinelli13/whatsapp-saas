'use strict';

/**
 * Middleware: verificarMaster
 *
 * Validates that user has role='master'
 * Master is the system owner (no client scoping)
 *
 * Usage:
 *   router.post('/api/master/clientes', verificarMaster, MasterController.criarCliente)
 *
 * Expected:
 *   req.usuario.role === 'master'
 *
 * Returns:
 *   200: next() → continue to handler
 *   401: not authenticated (should be caught by auth middleware first)
 *   403: not master role
 */

const verificarMaster = (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        erro: 'Não autenticado',
        detalhes: 'req.usuario não encontrado',
      });
    }

    if (req.usuario.role !== 'master') {
      console.warn(
        `[verificarMaster] Acesso negado para usuário ${req.usuario.id} com role '${req.usuario.role}'`
      );

      return res.status(403).json({
        erro: 'Acesso negado',
        detalhes: 'Apenas master pode acessar este endpoint',
        seu_role: req.usuario.role,
      });
    }

    console.log(
      `[verificarMaster] Master ${req.usuario.email} acessando ${req.method} ${req.path}`
    );

    next();
  } catch (erro) {
    console.error('[verificarMaster] Erro inesperado:', erro);
    return res.status(500).json({
      erro: 'Erro ao verificar permissão',
      detalhes: process.env.NODE_ENV === 'development' ? erro.message : undefined,
    });
  }
};

module.exports = verificarMaster;
