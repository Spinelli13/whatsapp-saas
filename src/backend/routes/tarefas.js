'use strict';

const { Router } = require('express');
const { verificarJWT } = require('../middleware/auth');
const TarefaService = require('../services/tarefaService');
const CalendarioService = require('../services/calendarioService');

const router = Router();
router.use(verificarJWT);

// ── Calendário — rotas estáticas ANTES de /:id ─────────────────────────────

router.get('/calendario/proximos', async (req, res, next) => {
  try {
    res.json(await CalendarioService.proximosEventos(req.usuario.cliente_id, req.query.dias));
  } catch (err) { next(err); }
});

router.get('/calendario/eventos', async (req, res, next) => {
  try {
    res.json(await CalendarioService.listar(req.usuario.cliente_id, req.query));
  } catch (err) { next(err); }
});

router.post('/calendario/eventos', async (req, res, next) => {
  try {
    if (!req.body.titulo || !req.body.data_inicio) {
      return res.status(400).json({ error: 'titulo e data_inicio são obrigatórios' });
    }
    const evento = await CalendarioService.criar(req.usuario.cliente_id, req.body, req.usuario.id);
    res.status(201).json(evento);
  } catch (err) { next(err); }
});

router.get('/calendario/eventos/:id', async (req, res, next) => {
  try {
    const evento = await CalendarioService.obter(req.params.id, req.usuario.cliente_id);
    if (!evento) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json(evento);
  } catch (err) { next(err); }
});

router.put('/calendario/eventos/:id', async (req, res, next) => {
  try {
    const evento = await CalendarioService.atualizar(req.params.id, req.usuario.cliente_id, req.body);
    if (!evento) return res.status(404).json({ error: 'Evento não encontrado' });
    res.json(evento);
  } catch (err) { next(err); }
});

router.delete('/calendario/eventos/:id', async (req, res, next) => {
  try {
    await CalendarioService.deletar(req.params.id, req.usuario.cliente_id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Métricas — rota estática ANTES de /:id ────────────────────────────────

router.get('/metricas', async (req, res, next) => {
  try {
    res.json(await TarefaService.metricas(req.usuario.cliente_id));
  } catch (err) { next(err); }
});

// ── Tarefas CRUD ──────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    res.json(await TarefaService.listar(req.usuario.cliente_id, req.query));
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    if (!req.body.titulo) return res.status(400).json({ error: 'Título obrigatório' });
    const tarefa = await TarefaService.criar(req.usuario.cliente_id, req.body, req.usuario.id);
    res.status(201).json(tarefa);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const tarefa = await TarefaService.obter(req.params.id, req.usuario.cliente_id);
    if (!tarefa) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json(tarefa);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const tarefa = await TarefaService.atualizar(req.params.id, req.usuario.cliente_id, req.body);
    if (!tarefa) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json(tarefa);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await TarefaService.deletar(req.params.id, req.usuario.cliente_id);
    if (!deleted) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status obrigatório' });
    const tarefa = await TarefaService.mudarStatus(req.params.id, req.usuario.cliente_id, status);
    if (!tarefa) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json(tarefa);
  } catch (err) { next(err); }
});

router.post('/:id/atribuir', async (req, res, next) => {
  try {
    const { usuario_id } = req.body;
    if (!usuario_id) return res.status(400).json({ error: 'usuario_id obrigatório' });
    const tarefa = await TarefaService.atribuir(req.params.id, req.usuario.cliente_id, usuario_id);
    if (!tarefa) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json(tarefa);
  } catch (err) { next(err); }
});

module.exports = router;
