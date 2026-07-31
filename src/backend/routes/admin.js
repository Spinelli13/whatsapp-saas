'use strict';

/**
 * Routes: Admin
 *
 * All endpoints for admin (client manager)
 * All routes require a valid JWT (verificarJWT) and role='admin'
 * (verificarAdmin, which also guarantees req.usuario.cliente_id is set)
 *
 * Admin endpoints:
 *   /api/admin/dashboard            - Client dashboard with consumption
 *   /api/admin/modulos-contratados  - View contracted modules
 *   /api/admin/solicitar-plano      - Request plan upgrade
 *   /api/admin/solicitar-modulo     - Request module addition
 *   /api/admin/minhas-solicitacoes  - View own upgrade requests
 *   /api/admin/atendentes           - CRUD team members
 *   /api/admin/atendentes/:id/permissoes - Manage per-module permissions
 */

const express = require('express');
const router = express.Router();

const AdminController = require('../controllers/AdminController');
const { verificarJWT } = require('../middleware/auth');
const verificarAdmin = require('../middleware/verificarAdmin');

router.use(verificarJWT);
router.use(verificarAdmin);

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD & STATUS
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/dashboard
 * View client dashboard with consumption
 */
router.get('/dashboard', AdminController.dashboardAdmin);

// ═══════════════════════════════════════════════════════════════════════
// MODULES
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/modulos-contratados
 * List modules this client can access
 */
router.get('/modulos-contratados', AdminController.listarModulosContratados);

// ═══════════════════════════════════════════════════════════════════════
// UPGRADE REQUESTS - ADMIN SIDE
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/solicitar-plano
 * Request upgrade to a new plan (body: { plano_id })
 */
router.post('/solicitar-plano', AdminController.solicitarNovoPlano);

/**
 * POST /api/admin/solicitar-modulo
 * Request addition of a new module (body: { modulo_id })
 */
router.post('/solicitar-modulo', AdminController.solicitarNovoModulo);

/**
 * GET /api/admin/minhas-solicitacoes
 * List this client's upgrade requests
 *
 * Query params: ?status=pendente|aprovado|recusado
 */
router.get('/minhas-solicitacoes', AdminController.listarMinhasSolicitacoes);

// ═══════════════════════════════════════════════════════════════════════
// ATTENDANTS - CRUD & PERMISSIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/atendentes
 * Create a new team member (role='atendente', scoped to req.usuario.cliente_id)
 */
router.post('/atendentes', AdminController.criarAtendente);

/**
 * GET /api/admin/atendentes
 * List all team members for this client
 */
router.get('/atendentes', AdminController.listarAtendentes);

/**
 * PUT /api/admin/atendentes/:id
 * Update a team member
 */
router.put('/atendentes/:id', AdminController.atualizarAtendente);

/**
 * DELETE /api/admin/atendentes/:id
 * Soft delete a team member (status = 'inativo')
 */
router.delete('/atendentes/:id', AdminController.deletarAtendente);

// ═══════════════════════════════════════════════════════════════════════
// PERMISSIONS - ADVANCED
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/atendentes/:id/permissoes
 * Set (replace) module permissions for a team member (body: { modulos })
 */
router.post('/atendentes/:id/permissoes', AdminController.definirPermissoesAtendente);

/**
 * GET /api/admin/atendentes/:id/permissoes
 * Get module permissions for a team member
 */
router.get('/atendentes/:id/permissoes', AdminController.obterPermissoesAtendente);

module.exports = router;
