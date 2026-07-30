'use strict';

const { Router } = require('express');
const RespostaRapidaService = require('../services/RespostaRapidaService');
const { verificarJWT } = require('../middleware/auth');

const router = Router();

router.use(verificarJWT);

router.get('/', async (req, res, next) => {
  try {
    const respostas = await RespostaRapidaService.listar(req.usuario.cliente_id);
    res.json({ data: respostas });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const resposta = await RespostaRapidaService.obter(req.usuario.cliente_id, req.params.id);
    res.json({ data: resposta });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { titulo, conteudo, atalho } = req.body;
    if (!titulo?.trim() || !conteudo?.trim()) {
      return res.status(400).json({ erro: 'Título e conteúdo são obrigatórios' });
    }
    const resposta = await RespostaRapidaService.criar(req.usuario.cliente_id, { titulo, conteudo, atalho });
    res.status(201).json({ data: resposta });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { titulo, conteudo, atalho, ativo } = req.body;
    const resposta = await RespostaRapidaService.atualizar(
      req.usuario.cliente_id, req.params.id, { titulo, conteudo, atalho, ativo }
    );
    res.json({ data: resposta });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await RespostaRapidaService.deletar(req.usuario.cliente_id, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
