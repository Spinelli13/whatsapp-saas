'use strict';

/**
 * Routes: Master
 *
 * All endpoints for master (system owner)
 * All routes require a valid JWT (verificarJWT) and role='master'
 * (verificarMaster)
 *
 * Master endpoints:
 *   /api/master/clientes       - CRUD clientes
 *   /api/master/planos         - CRUD planos
 *   /api/master/atribuir-plano - Assign plan to client
 *   /api/master/dashboard      - Financial dashboard
 *   /api/master/solicitacoes   - Manage upgrade requests
 */

const express = require('express');
const router = express.Router();

const MasterController = require('../controllers/MasterController');
const { verificarJWT } = require('../middleware/auth');
const verificarMaster = require('../middleware/verificarMaster');

router.use(verificarJWT);
router.use(verificarMaster);

// ═══════════════════════════════════════════════════════════════════════
// CLIENTES - CRUD
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/master/clientes
 * Create a new client
 */
router.post('/clientes', MasterController.criarCliente);

/**
 * GET /api/master/clientes
 * List all clients with pagination and filters
 *
 * Query params: ?page=1&limit=10&status=ativo&search=ACN
 */
router.get('/clientes', MasterController.listarClientes);

/**
 * PUT /api/master/clientes/:id
 * Update a client
 */
router.put('/clientes/:id', MasterController.atualizarCliente);

/**
 * DELETE /api/master/clientes/:id
 * Soft delete a client (status = 'inativo')
 */
router.delete('/clientes/:id', MasterController.deletarCliente);

/**
 * GET /api/master/clientes/:id/consumo
 * View client's current consumption and limits
 */
router.get('/clientes/:id/consumo', MasterController.verConsumoCliente);

// ═══════════════════════════════════════════════════════════════════════
// PLANOS - CRUD
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/master/planos
 * Create a new plan
 */
router.post('/planos', MasterController.criarPlano);

/**
 * GET /api/master/planos
 * List all plans with their modules
 */
router.get('/planos', MasterController.listarPlanos);

/**
 * PUT /api/master/planos/:id
 * Update a plan (including modules)
 */
router.put('/planos/:id', MasterController.atualizarPlano);

/**
 * DELETE /api/master/planos/:id
 * Soft delete a plan (409 if active clients are using it)
 */
router.delete('/planos/:id', MasterController.deletarPlano);

// ═══════════════════════════════════════════════════════════════════════
// PLAN ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/master/atribuir-plano
 * Assign (or upgrade) a plan to a client
 *
 * Deactivates previous plan, creates new ClientePlano (status='ativo'),
 * syncs ClienteModulos to match the new plan's modules.
 */
router.post('/atribuir-plano', MasterController.atribuirPlanoCliente);

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/master/dashboard
 * Master financial and operational dashboard
 */
router.get('/dashboard', MasterController.dashboardMaster);

// ═══════════════════════════════════════════════════════════════════════
// UPGRADE REQUESTS - MASTER APPROVAL
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/master/solicitacoes
 * List all upgrade requests
 *
 * Query params: ?status=pendente|aprovado|recusado&tipo=plano|modulo
 */
router.get('/solicitacoes', MasterController.listarSolicitacoes);

/**
 * POST /api/master/solicitacoes/:id/aprovar
 * Approve an upgrade request
 */
router.post('/solicitacoes/:id/aprovar', MasterController.aprovarSolicitacao);

/**
 * POST /api/master/solicitacoes/:id/recusar
 * Reject an upgrade request (body: { motivo_recusa })
 */
router.post('/solicitacoes/:id/recusar', MasterController.recusarSolicitacao);

module.exports = router;
