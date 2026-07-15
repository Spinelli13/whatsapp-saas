'use strict';

const express = require('express');
const router = express.Router();

const { verificarJWT } = require('../middleware/auth');
const verificarPermissao = require('../middleware/verificarPermissao');
const RoleService = require('../services/roleService');

router.use(verificarJWT);

// IMPORTANT: /permissoes/listar must come BEFORE /:id so Express doesn't
// treat "permissoes" as a route parameter.
router.get('/permissoes/listar', verificarPermissao('configuracoes.permissoes'), async (req, res, next) => {
  try {
    const por_categoria = await RoleService.listarPermissoesPorCategoria();
    res.json({ por_categoria });
  } catch (err) {
    next(err);
  }
});

// List roles for the authenticated client
router.get('/', verificarPermissao('configuracoes.permissoes'), async (req, res, next) => {
  try {
    const roles = await RoleService.listarRoles(req.usuario.cliente_id);
    res.json({ roles });
  } catch (err) {
    next(err);
  }
});

// Get single role
router.get('/:id', verificarPermissao('configuracoes.permissoes'), async (req, res, next) => {
  try {
    const role = await RoleService.buscarRole(req.params.id, req.usuario.cliente_id);
    if (!role) return res.status(404).json({ erro: 'Role não encontrada' });
    res.json({ role });
  } catch (err) {
    next(err);
  }
});

// Create custom role
router.post('/', verificarPermissao('configuracoes.permissoes'), async (req, res, next) => {
  try {
    const { nome, descricao, eh_customizado } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
    const role = await RoleService.criarRole(req.usuario.cliente_id, { nome, descricao, eh_customizado });
    res.status(201).json({ role });
  } catch (err) {
    next(err);
  }
});

// Add permission to role
router.post('/:role_id/permissoes/:permissao_id', verificarPermissao('configuracoes.permissoes'), async (req, res, next) => {
  try {
    const { role_id, permissao_id } = req.params;
    await RoleService.adicionarPermissao(role_id, permissao_id, req.usuario.cliente_id);
    res.json({ mensagem: 'Permissão adicionada' });
  } catch (err) {
    if (err.message === 'Role não encontrada' || err.message === 'Permissão não encontrada') {
      return res.status(404).json({ erro: err.message });
    }
    next(err);
  }
});

// Remove permission from role
router.delete('/:role_id/permissoes/:permissao_id', verificarPermissao('configuracoes.permissoes'), async (req, res, next) => {
  try {
    const { role_id, permissao_id } = req.params;
    await RoleService.removerPermissao(role_id, permissao_id, req.usuario.cliente_id);
    res.json({ mensagem: 'Permissão removida' });
  } catch (err) {
    if (err.message === 'Role não encontrada' || err.message === 'Permissão não encontrada') {
      return res.status(404).json({ erro: err.message });
    }
    next(err);
  }
});

// Assign role to user
router.post('/:role_id/usuarios/:usuario_id', verificarPermissao('usuarios.gerenciar_roles'), async (req, res, next) => {
  try {
    const { role_id, usuario_id } = req.params;
    const usuario = await RoleService.atribuirRoleAUsuario(usuario_id, role_id, req.usuario.cliente_id);
    res.json({ mensagem: 'Role atribuída', usuario_id: usuario.id, role_id: usuario.role_id });
  } catch (err) {
    if (err.message === 'Role não encontrada' || err.message === 'Usuário não encontrado') {
      return res.status(404).json({ erro: err.message });
    }
    next(err);
  }
});

module.exports = router;
