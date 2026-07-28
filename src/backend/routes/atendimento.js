'use strict';

const { Router } = require('express');
const { verificarJWT } = require('../middleware/auth');
const AtendimentoService = require('../services/atendimentoService');
const FilaAtendimentoService = require('../services/filaAtendimentoService');
const ChatbotService = require('../services/chatbotService');

const router = Router();
router.use(verificarJWT);

// ── Webhook simulado — recebe mensagem WhatsApp ───────────────────────────────
// Útil para demos e testes de integração sem Baileys real.

router.post('/receber', async (req, res, next) => {
  try {
    const { numero, mensagem } = req.body;
    if (!numero || !mensagem) {
      return res.status(400).json({ error: 'numero e mensagem são obrigatórios' });
    }
    const resultado = await AtendimentoService.receber(req.usuario.cliente_id, numero, mensagem);
    res.status(201).json(resultado);
  } catch (err) { next(err); }
});

// ── Status: lista todos os atendimentos do cliente ────────────────────────────

router.get('/status', async (req, res, next) => {
  try {
    res.json(await AtendimentoService.listar(req.usuario.cliente_id, req.query));
  } catch (err) { next(err); }
});

// ── Fila: lista pendentes (opcionalmente por setor) ───────────────────────────

router.get('/fila', async (req, res, next) => {
  try {
    res.json(await FilaAtendimentoService.listar(req.usuario.cliente_id, req.query.setor));
  } catch (err) { next(err); }
});

// ── Dashboard de métricas ─────────────────────────────────────────────────────
// Deve vir ANTES de /:id para não ser capturado pelo parâmetro dinâmico.

router.get('/stats/dashboard', async (req, res, next) => {
  try {
    res.json(await FilaAtendimentoService.dashboard(req.usuario.cliente_id));
  } catch (err) { next(err); }
});

// ── Análise de mensagem via chatbot ──────────────────────────────────────────

router.post('/chatbot/analisar', async (req, res, next) => {
  try {
    const { mensagem } = req.body;
    if (!mensagem) return res.status(400).json({ error: 'mensagem é obrigatória' });
    res.json(ChatbotService.analisar(mensagem));
  } catch (err) { next(err); }
});

// ── Operações por atendimento (:id) ──────────────────────────────────────────

router.post('/:id/pegar', async (req, res, next) => {
  try {
    const atendimento = await FilaAtendimentoService.pegar(
      req.params.id, req.usuario.cliente_id, req.usuario.id
    );
    if (!atendimento) {
      return res.status(404).json({ error: 'Atendimento não encontrado ou não está pendente' });
    }
    res.json(atendimento);
  } catch (err) { next(err); }
});

router.post('/:id/mensagem', async (req, res, next) => {
  try {
    if (!req.body.mensagem) return res.status(400).json({ error: 'mensagem é obrigatória' });
    const msg = await FilaAtendimentoService.enviarMensagem(
      req.params.id, req.usuario.cliente_id, req.body.mensagem
    );
    if (!msg) return res.status(404).json({ error: 'Atendimento não encontrado' });
    res.status(201).json(msg);
  } catch (err) { next(err); }
});

router.post('/:id/dados', async (req, res, next) => {
  try {
    const atendimento = await FilaAtendimentoService.marcarDados(
      req.params.id, req.usuario.cliente_id, req.body
    );
    if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });
    res.json(atendimento);
  } catch (err) { next(err); }
});

router.post('/:id/encaminhar', async (req, res, next) => {
  try {
    const oportunidade = await FilaAtendimentoService.encaminharVenda(
      req.params.id, req.usuario.cliente_id, req.body
    );
    if (!oportunidade) return res.status(404).json({ error: 'Atendimento não encontrado' });
    res.status(201).json(oportunidade);
  } catch (err) { next(err); }
});

router.post('/:id/encerrar', async (req, res, next) => {
  try {
    const atendimento = await FilaAtendimentoService.encerrar(
      req.params.id, req.usuario.cliente_id
    );
    if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });
    res.json(atendimento);
  } catch (err) { next(err); }
});

router.post('/:id/feedback', async (req, res, next) => {
  try {
    const score = Number(req.body.score);
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'score deve ser um número entre 1 e 5' });
    }
    const atendimento = await FilaAtendimentoService.feedback(
      req.params.id, req.usuario.cliente_id, score
    );
    if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });
    res.json(atendimento);
  } catch (err) { next(err); }
});

module.exports = router;
