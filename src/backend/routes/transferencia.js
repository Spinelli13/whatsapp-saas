'use strict';

const { Router } = require('express');
const { verificarJWT } = require('../middleware/auth');
const TransferenciaService = require('../services/TransferenciaService');

const router = Router();
router.use(verificarJWT);

// Solicitar transferência
router.post('/solicitar', async (req, res, next) => {
  try {
    const { atendimento_id, atendente_destino_id, motivo, departamento_destino_id } = req.body;

    if (!atendimento_id || !atendente_destino_id) {
      return res.status(400).json({ erro: 'atendimento_id e atendente_destino_id são obrigatórios' });
    }

    const transferencia = await TransferenciaService.solicitar(
      { atendimento_id, atendente_destino_id, motivo, departamento_destino_id },
      req.usuario
    );

    return res.status(201).json({ data: transferencia });
  } catch (err) {
    next(err);
  }
});

// Aceitar transferência
router.patch('/:id/aceitar', async (req, res, next) => {
  try {
    const transferencia = await TransferenciaService.aceitar(req.params.id, req.usuario);
    return res.json({ data: transferencia });
  } catch (err) {
    next(err);
  }
});

// Rejeitar transferência
router.patch('/:id/rejeitar', async (req, res, next) => {
  try {
    const { motivo } = req.body;
    const transferencia = await TransferenciaService.rejeitar(req.params.id, motivo, req.usuario);
    return res.json({ data: transferencia });
  } catch (err) {
    next(err);
  }
});

// Cancelar transferência
router.patch('/:id/cancelar', async (req, res, next) => {
  try {
    const transferencia = await TransferenciaService.cancelar(req.params.id, req.usuario);
    return res.json({ data: transferencia });
  } catch (err) {
    next(err);
  }
});

// Listar transferências (com filtros opcionais)
router.get('/', async (req, res, next) => {
  try {
    const { atendimento_id, status } = req.query;
    const transferencias = await TransferenciaService.listar({ atendimento_id, status }, req.usuario);
    return res.json({ data: transferencias });
  } catch (err) {
    next(err);
  }
});

// Transferências pendentes para o usuário logado
router.get('/pendentes', async (req, res, next) => {
  try {
    const transferencias = await TransferenciaService.pendentesParaMim(req.usuario);
    return res.json({ data: transferencias });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
