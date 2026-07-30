'use strict';

const { Router } = require('express');
const AtendenteStatusService = require('../services/AtendenteStatusService');
const { verificarJWT } = require('../middleware/auth');

const router = Router();

router.use(verificarJWT);

// GET /api/atendente/listar?status=online
// Deve vir ANTES de /:id/status para que "listar" não seja capturado como :id
router.get('/listar', async (req, res, next) => {
  try {
    const { status } = req.query;
    const atendentes = await AtendenteStatusService.listarAtendentes(
      req.usuario.cliente_id,
      status || null
    );
    res.json({ data: atendentes });
  } catch (err) {
    next(err);
  }
});

// GET /api/atendente/:id/status
router.get('/:id/status', async (req, res, next) => {
  try {
    const usuario = await AtendenteStatusService.obter(req.params.id);
    res.json({ data: usuario });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/atendente/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (req.params.id !== String(req.usuario.id)) {
      return res.status(403).json({ erro: 'Não pode mudar status de outro usuário' });
    }

    const usuario = await AtendenteStatusService.mudar(req.params.id, status);

    if (req.io) {
      req.io.to(`cliente-${req.usuario.cliente_id}`).emit('atendente_status_mudou', {
        usuario_id: usuario.id,
        nome: usuario.nome,
        status: usuario.status_atendente,
      });
    }

    res.json({ data: usuario });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
