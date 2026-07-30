'use strict';
const { Router } = require('express');
const RoteamentoService = require('../services/RoteamentoService');
const { verificarJWT } = require('../middleware/auth');

const router = Router();

router.use(verificarJWT);

// ── Configurações de Roteamento ───────────────────────────────────────────────

router.get('/config', async (req, res, next) => {
  try {
    const configs = await RoteamentoService.listar(req.usuario.cliente_id);
    res.json({ data: configs });
  } catch (err) { next(err); }
});

router.post('/config', async (req, res, next) => {
  try {
    const { tipo_roteamento, limite_simultaneos, tempo_sla_minutos, departamento_id, habilitar_transbordo } = req.body;
    const config = await RoteamentoService.criar(req.usuario.cliente_id, {
      departamento_id: departamento_id || null,
      tipo_roteamento,
      limite_simultaneos,
      tempo_sla_minutos,
      habilitar_transbordo,
    });
    res.status(201).json({ data: config });
  } catch (err) { next(err); }
});

router.put('/config/:id', async (req, res, next) => {
  try {
    const config = await RoteamentoService.atualizar(req.usuario.cliente_id, req.params.id, req.body);
    res.json({ data: config });
  } catch (err) { next(err); }
});

// ── Skills do Atendente ───────────────────────────────────────────────────────

router.get('/skills', async (req, res, next) => {
  try {
    const skills = await RoteamentoService.listarSkillsAtendente(req.usuario.id, req.usuario.cliente_id);
    res.json({ data: skills });
  } catch (err) { next(err); }
});

router.post('/skill', async (req, res, next) => {
  try {
    const { nome_skill, nivel } = req.body;
    const skill = await RoteamentoService.criarSkill(req.usuario.id, req.usuario.cliente_id, nome_skill, nivel);
    res.status(201).json({ data: skill });
  } catch (err) { next(err); }
});

router.delete('/skill/:id', async (req, res, next) => {
  try {
    const result = await RoteamentoService.deletarSkill(req.params.id, req.usuario.id);
    res.json(result);
  } catch (err) { next(err); }
});

// ── SLA ───────────────────────────────────────────────────────────────────────

router.get('/sla/:atendimento_id', async (req, res, next) => {
  try {
    const result = await RoteamentoService.validarSLA(req.params.atendimento_id, 5);
    res.json({ data: result });
  } catch (err) { next(err); }
});

module.exports = router;
