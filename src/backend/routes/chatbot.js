'use strict';

const { Router } = require('express');
const ChatbotService = require('../services/chatbotService');
const { verificarJWT } = require('../middleware/auth');

const router = Router();

router.use(verificarJWT);

// GET /api/chatbot/fluxos
router.get('/fluxos', async (req, res, next) => {
  try {
    const fluxos = await ChatbotService.listarFluxos(req.usuario.cliente_id);
    res.json({ data: fluxos });
  } catch (err) { next(err); }
});

// GET /api/chatbot/fluxos/:id
router.get('/fluxos/:id', async (req, res, next) => {
  try {
    const fluxo = await ChatbotService.obterFluxo(req.usuario.cliente_id, req.params.id);
    res.json({ data: fluxo });
  } catch (err) { next(err); }
});

// POST /api/chatbot/fluxos
router.post('/fluxos', async (req, res, next) => {
  try {
    const { nome, descricao, mensagem_saudacao, mensagem_despedida } = req.body;
    const fluxo = await ChatbotService.criarFluxo(req.usuario.cliente_id, {
      nome, descricao, mensagem_saudacao, mensagem_despedida,
    });
    res.status(201).json({ data: fluxo });
  } catch (err) { next(err); }
});

// PUT /api/chatbot/fluxos/:id
router.put('/fluxos/:id', async (req, res, next) => {
  try {
    const { nome, descricao, mensagem_saudacao, mensagem_despedida, estrutura_json } = req.body;
    const dados = {};
    if (nome !== undefined) dados.nome = nome;
    if (descricao !== undefined) dados.descricao = descricao;
    if (mensagem_saudacao !== undefined) dados.mensagem_saudacao = mensagem_saudacao;
    if (mensagem_despedida !== undefined) dados.mensagem_despedida = mensagem_despedida;
    if (estrutura_json !== undefined) dados.estrutura_json = estrutura_json;

    const fluxo = await ChatbotService.atualizarFluxo(req.usuario.cliente_id, req.params.id, dados);
    res.json({ data: fluxo });
  } catch (err) { next(err); }
});

// PATCH /api/chatbot/fluxos/:id/ativar
router.patch('/fluxos/:id/ativar', async (req, res, next) => {
  try {
    const fluxo = await ChatbotService.ativarFluxo(req.usuario.cliente_id, req.params.id);
    res.json({ data: fluxo });
  } catch (err) { next(err); }
});

// DELETE /api/chatbot/fluxos/:id
router.delete('/fluxos/:id', async (req, res, next) => {
  try {
    const result = await ChatbotService.deletarFluxo(req.usuario.cliente_id, req.params.id);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/chatbot/testar
router.post('/testar', async (req, res, next) => {
  try {
    const { estrutura_json, resposta_usuario } = req.body;
    if (!estrutura_json) return res.status(400).json({ erro: 'estrutura_json obrigatório' });
    const resultado = ChatbotService.testarFluxo(estrutura_json, resposta_usuario || '');
    res.json({ data: resultado });
  } catch (err) { next(err); }
});

module.exports = router;
