'use strict';

const express = require('express');
const router = express.Router();
const { verificarJWT } = require('../middleware/auth');
const verificarPermissao = require('../middleware/verificarPermissao');
const PlanoService = require('../services/planoService');

// GET /api/planos/disponibles — public, no auth required
router.get('/disponibles', async (req, res, next) => {
  try {
    const planos = await PlanoService.listarPlanos();
    res.json(planos);
  } catch (err) {
    next(err);
  }
});

// GET /api/planos/meu-plano
router.get('/meu-plano', verificarJWT, async (req, res, next) => {
  try {
    const plano = await PlanoService.obterPlanoCliente(req.usuario.cliente_id);
    if (!plano) return res.status(404).json({ erro: 'Nenhum plano ativo encontrado' });
    res.json(plano);
  } catch (err) {
    next(err);
  }
});

// GET /api/planos/meu-uso
router.get('/meu-uso', verificarJWT, async (req, res, next) => {
  try {
    const [uso, limites] = await Promise.all([
      PlanoService.obterUsoCliente(req.usuario.cliente_id),
      PlanoService.verificarLimites(req.usuario.cliente_id).catch(() => null),
    ]);
    res.json({ uso, limites });
  } catch (err) {
    next(err);
  }
});

// POST /api/planos/cliente/:cliente_id/plano/:plano_id — admin only
router.post(
  '/cliente/:cliente_id/plano/:plano_id',
  verificarJWT,
  verificarPermissao('configuracoes.plano'),
  async (req, res, next) => {
    try {
      const clientePlano = await PlanoService.atribuirPlanoCliente(
        parseInt(req.params.cliente_id, 10),
        parseInt(req.params.plano_id, 10)
      );
      res.json(clientePlano);
    } catch (err) {
      if (err.message === 'Plano não encontrado') {
        return res.status(404).json({ erro: err.message });
      }
      next(err);
    }
  }
);

module.exports = router;
