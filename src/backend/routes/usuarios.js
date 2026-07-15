'use strict';

const express = require('express');
const router = express.Router();
const { verificarJWT } = require('../middleware/auth');
const verificarPermissao = require('../middleware/verificarPermissao');
const { verificarLimiteUsuarios } = require('../middleware/verificarLimite');
const authService = require('../services/authService');
const PlanoService = require('../services/planoService');

// POST /api/usuarios — create user within caller's client (admin only)
router.post(
  '/',
  verificarJWT,
  verificarPermissao('usuarios.criar'),
  verificarLimiteUsuarios,
  async (req, res, next) => {
    try {
      const { nome, email, senha, role = 'atendente' } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'nome, email e senha são obrigatórios' });
      }

      const resultado = await authService.register({
        nome,
        email,
        senha,
        cliente_id: req.usuario.cliente_id,
        role,
      });

      // Track usage — fire-and-forget so a counter error never breaks the response
      PlanoService.incrementarUsuarios(req.usuario.cliente_id).catch(() => {});

      res.status(201).json(resultado);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      next(err);
    }
  }
);

module.exports = router;
