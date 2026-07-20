'use strict';

const { Router } = require('express');
const { verificarJWT } = require('../middleware/auth');
const WorkflowService = require('../services/workflowService');
const TriggerService = require('../services/triggerService');
const AcaoService = require('../services/acaoService');

const router = Router();
router.use(verificarJWT);

// ── Workflows — rotas estáticas ANTES de /:id ─────────────────────────────────

router.get('/workflows/stats/dashboard', async (req, res, next) => {
  try {
    const stats = await WorkflowService.obterEstatisticas(req.usuario.cliente_id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.get('/workflows', async (req, res, next) => {
  try {
    const workflows = await WorkflowService.listar(req.usuario.cliente_id, req.query);
    res.json(workflows);
  } catch (err) {
    next(err);
  }
});

router.post('/workflows', async (req, res, next) => {
  try {
    const workflow = await WorkflowService.criar(req.usuario.cliente_id, req.body);
    res.status(201).json(workflow);
  } catch (err) {
    if (err.message.includes('obrigatório')) return res.status(400).json({ error: err.message });
    next(err);
  }
});

// ── Workflows — rotas com /:id DEPOIS das estáticas ───────────────────────────

router.get('/workflows/:id', async (req, res, next) => {
  try {
    const workflow = await WorkflowService.obter(req.params.id, req.usuario.cliente_id);
    if (!workflow) return res.status(404).json({ error: 'Workflow não encontrado' });
    res.json(workflow);
  } catch (err) {
    next(err);
  }
});

router.put('/workflows/:id', async (req, res, next) => {
  try {
    const workflow = await WorkflowService.atualizar(req.params.id, req.usuario.cliente_id, req.body);
    if (!workflow) return res.status(404).json({ error: 'Workflow não encontrado' });
    res.json(workflow);
  } catch (err) {
    next(err);
  }
});

router.post('/workflows/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status é obrigatório' });
    const workflow = await WorkflowService.alterarStatus(req.params.id, req.usuario.cliente_id, status);
    if (!workflow) return res.status(404).json({ error: 'Workflow não encontrado' });
    res.json(workflow);
  } catch (err) {
    if (err.message === 'Status inválido') return res.status(400).json({ error: err.message });
    next(err);
  }
});

router.delete('/workflows/:id', async (req, res, next) => {
  try {
    const count = await WorkflowService.deletar(req.params.id, req.usuario.cliente_id);
    if (count === 0) return res.status(404).json({ error: 'Workflow não encontrado' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Triggers ──────────────────────────────────────────────────────────────────

router.post('/workflows/:workflowId/triggers', async (req, res, next) => {
  try {
    const workflow = await WorkflowService.obter(req.params.workflowId, req.usuario.cliente_id);
    if (!workflow) return res.status(404).json({ error: 'Workflow não encontrado' });
    const trigger = await TriggerService.criar(req.params.workflowId, req.body);
    res.status(201).json(trigger);
  } catch (err) {
    if (err.message.includes('obrigatório')) return res.status(400).json({ error: err.message });
    next(err);
  }
});

router.put('/triggers/:id', async (req, res, next) => {
  try {
    const trigger = await TriggerService.atualizar(req.params.id, req.body);
    if (!trigger) return res.status(404).json({ error: 'Trigger não encontrado' });
    res.json(trigger);
  } catch (err) {
    next(err);
  }
});

router.delete('/triggers/:id', async (req, res, next) => {
  try {
    const count = await TriggerService.deletar(req.params.id);
    if (count === 0) return res.status(404).json({ error: 'Trigger não encontrado' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Ações ─────────────────────────────────────────────────────────────────────

router.post('/workflows/:workflowId/acoes', async (req, res, next) => {
  try {
    const workflow = await WorkflowService.obter(req.params.workflowId, req.usuario.cliente_id);
    if (!workflow) return res.status(404).json({ error: 'Workflow não encontrado' });
    const acao = await AcaoService.criar(req.params.workflowId, req.body);
    res.status(201).json(acao);
  } catch (err) {
    if (err.message.includes('obrigatório') || err.message.includes('obrigatória')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.put('/acoes/:id', async (req, res, next) => {
  try {
    const acao = await AcaoService.atualizar(req.params.id, req.body);
    if (!acao) return res.status(404).json({ error: 'Ação não encontrada' });
    res.json(acao);
  } catch (err) {
    next(err);
  }
});

router.delete('/acoes/:id', async (req, res, next) => {
  try {
    const count = await AcaoService.deletar(req.params.id);
    if (count === 0) return res.status(404).json({ error: 'Ação não encontrada' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
