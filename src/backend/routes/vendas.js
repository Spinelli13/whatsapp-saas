'use strict';

const { Router } = require('express');
const { verificarJWT } = require('../middleware/auth');
const PipelineService = require('../services/pipelineService');
const OportunidadeService = require('../services/oportunidadeService');

const router = Router();
router.use(verificarJWT);

// ── Pipeline (estágios) ────────────────────────────────────────────────────

router.get('/pipeline', async (req, res, next) => {
  try {
    res.json(await PipelineService.obterPipelineCompleto(req.usuario.cliente_id));
  } catch (err) { next(err); }
});

router.get('/pipeline/estagios', async (req, res, next) => {
  try {
    res.json(await PipelineService.listarEstagios(req.usuario.cliente_id));
  } catch (err) { next(err); }
});

router.post('/pipeline/estagios', async (req, res, next) => {
  try {
    const estagio = await PipelineService.criarEstagio(req.usuario.cliente_id, req.body);
    res.status(201).json(estagio);
  } catch (err) { next(err); }
});

router.put('/pipeline/estagios/:id', async (req, res, next) => {
  try {
    const estagio = await PipelineService.atualizarEstagio(
      req.params.id, req.usuario.cliente_id, req.body
    );
    if (!estagio) return res.status(404).json({ error: 'Estágio não encontrado' });
    res.json(estagio);
  } catch (err) { next(err); }
});

router.delete('/pipeline/estagios/:id', async (req, res, next) => {
  try {
    await PipelineService.deletarEstagio(req.params.id, req.usuario.cliente_id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Métricas ───────────────────────────────────────────────────────────────

router.get('/metricas', async (req, res, next) => {
  try {
    res.json(await OportunidadeService.metricas(req.usuario.cliente_id));
  } catch (err) { next(err); }
});

// ── Oportunidades ──────────────────────────────────────────────────────────

router.get('/oportunidades', async (req, res, next) => {
  try {
    res.json(await OportunidadeService.listar(req.usuario.cliente_id, req.query));
  } catch (err) { next(err); }
});

router.post('/oportunidades', async (req, res, next) => {
  try {
    if (!req.body.titulo) return res.status(400).json({ error: 'Título obrigatório' });
    const op = await OportunidadeService.criar(req.usuario.cliente_id, req.body, req.usuario.id);
    res.status(201).json(op);
  } catch (err) { next(err); }
});

router.get('/oportunidades/:id', async (req, res, next) => {
  try {
    const op = await OportunidadeService.obter(req.params.id, req.usuario.cliente_id);
    if (!op) return res.status(404).json({ error: 'Oportunidade não encontrada' });
    res.json(op);
  } catch (err) { next(err); }
});

router.put('/oportunidades/:id', async (req, res, next) => {
  try {
    const op = await OportunidadeService.atualizar(
      req.params.id, req.usuario.cliente_id, req.body, req.usuario.id
    );
    if (!op) return res.status(404).json({ error: 'Oportunidade não encontrada' });
    res.json(op);
  } catch (err) { next(err); }
});

router.delete('/oportunidades/:id', async (req, res, next) => {
  try {
    const deleted = await OportunidadeService.deletar(req.params.id, req.usuario.cliente_id);
    if (!deleted) return res.status(404).json({ error: 'Oportunidade não encontrada' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/oportunidades/:id/mover', async (req, res, next) => {
  try {
    const { estagio_id, posicao } = req.body;
    if (!estagio_id) return res.status(400).json({ error: 'estagio_id obrigatório' });
    const op = await OportunidadeService.moverParaEstagio(
      req.params.id, req.usuario.cliente_id, estagio_id, req.usuario.id, posicao
    );
    if (!op) return res.status(404).json({ error: 'Oportunidade ou estágio não encontrado' });
    res.json(op);
  } catch (err) { next(err); }
});

router.post('/oportunidades/:id/ganhar', async (req, res, next) => {
  try {
    const op = await OportunidadeService.fecharGanha(
      req.params.id, req.usuario.cliente_id, req.usuario.id
    );
    if (!op) return res.status(404).json({ error: 'Oportunidade não encontrada' });
    res.json(op);
  } catch (err) { next(err); }
});

router.post('/oportunidades/:id/perder', async (req, res, next) => {
  try {
    const { motivo } = req.body;
    const op = await OportunidadeService.fecharPerdida(
      req.params.id, req.usuario.cliente_id, motivo, req.usuario.id
    );
    if (!op) return res.status(404).json({ error: 'Oportunidade não encontrada' });
    res.json(op);
  } catch (err) { next(err); }
});

module.exports = router;
