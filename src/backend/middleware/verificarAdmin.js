'use strict';

/**
 * Middleware: verificarAdmin
 *
 * Validates that user has role='admin'
 * Admin is a client manager (scoped to their client)
 *
 * IMPORTANT: req.usuario.cliente_id (already present on the JWT payload,
 * see authService._payload) is what controllers use to scope every query
 * to this client only — preventing an admin from accessing another
 * client's data.
 *
 * Usage:
 *   router.post('/api/admin/atendentes', verificarAdmin, AdminController.criarAtendente)
 *
 * Expected:
 *   req.usuario.role === 'admin'
 *   req.usuario.cliente_id is defined
 *
 * Returns:
 *   200: next() → continue to handler
 *   401: not authenticated
 *   403: not admin role
 */

const verificarAdmin = (req, res, next) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        erro: 'Não autenticado',
        detalhes: 'req.usuario não encontrado',
      });
    }

    if (req.usuario.role !== 'admin') {
      console.warn(
        `[verificarAdmin] Acesso negado para usuário ${req.usuario.id} com role '${req.usuario.role}'`
      );

      return res.status(403).json({
        erro: 'Acesso negado',
        detalhes: 'Apenas admin pode acessar este endpoint',
        seu_role: req.usuario.role,
      });
    }

    // Todo admin deve estar ligado a um cliente
    if (!req.usuario.cliente_id) {
      console.error(`[verificarAdmin] Admin ${req.usuario.id} sem cliente_id!`);

      return res.status(500).json({
        erro: 'Configuração inválida',
        detalhes: 'Admin sem cliente associado',
      });
    }

    console.log(
      `[verificarAdmin] Admin ${req.usuario.email} (cliente_id: ${req.usuario.cliente_id}) acessando ${req.method} ${req.path}`
    );

    next();
  } catch (erro) {
    console.error('[verificarAdmin] Erro inesperado:', erro);
    return res.status(500).json({
      erro: 'Erro ao verificar permissão',
      detalhes: process.env.NODE_ENV === 'development' ? erro.message : undefined,
    });
  }
};

module.exports = verificarAdmin;
