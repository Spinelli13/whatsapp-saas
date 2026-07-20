'use strict';

const { Router } = require('express');
const { verificarJWT } = require('../middleware/auth');
const AnalyticsService = require('../services/analyticsService');
const SentimentService = require('../services/sentimentService');
const IAService = require('../services/iaService');

const router = Router();
router.use(verificarJWT);

// ── Métricas de Vendas ─────────────────────────────────────────────────────────

router.get('/metricas/diarias', async (req, res, next) => {
  try {
    const { dataInicio, dataFim } = req.query;
    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'dataInicio e dataFim são obrigatórios' });
    }
    const metricas = await AnalyticsService.obterMetricasVendas(
      req.usuario.cliente_id,
      new Date(dataInicio),
      new Date(dataFim)
    );
    res.json(metricas);
  } catch (err) {
    next(err);
  }
});

router.post('/metricas/calcular', async (req, res, next) => {
  try {
    const data = req.body.data ? new Date(req.body.data) : new Date();
    const metrica = await AnalyticsService.calcularMetricasDiarias(req.usuario.cliente_id, data);
    res.status(201).json(metrica);
  } catch (err) {
    next(err);
  }
});

router.get('/tendencias', async (req, res, next) => {
  try {
    const dias = req.query.dias ? parseInt(req.query.dias, 10) : 30;
    const tendencias = await AnalyticsService.obterTendencias(req.usuario.cliente_id, dias);
    res.json(tendencias);
  } catch (err) {
    next(err);
  }
});

// ── Análise de Sentimento ──────────────────────────────────────────────────────

router.post('/sentimento/analisar', async (req, res, next) => {
  try {
    const analise = await SentimentService.analisar(req.usuario.cliente_id, req.body);
    res.status(201).json(analise);
  } catch (err) {
    if (err.message.includes('obrigatório')) return res.status(400).json({ error: err.message });
    next(err);
  }
});

router.get('/sentimento/historico', async (req, res, next) => {
  try {
    const analises = await SentimentService.listar(req.usuario.cliente_id, req.query);
    res.json(analises);
  } catch (err) {
    next(err);
  }
});

// ── IA / Previsões ─────────────────────────────────────────────────────────────

router.get('/ia/previsoes', async (req, res, next) => {
  try {
    const previsoes = await IAService.obterPrevisoes(
      req.usuario.cliente_id,
      req.query.oportunidade_id || null
    );
    res.json(previsoes);
  } catch (err) {
    next(err);
  }
});

// ── IA / Recomendações — estáticas ANTES de /:id ──────────────────────────────

router.get('/ia/recomendacoes', async (req, res, next) => {
  try {
    const recomendacoes = await IAService.obterRecomendacoes(
      req.usuario.cliente_id,
      req.usuario.id
    );
    res.json(recomendacoes);
  } catch (err) {
    next(err);
  }
});

router.post('/ia/recomendacoes', async (req, res, next) => {
  try {
    const recomendacao = await IAService.criarRecomendacao(
      req.usuario.cliente_id,
      req.usuario.id,
      req.body
    );
    res.status(201).json(recomendacao);
  } catch (err) {
    if (err.message.includes('obrigatório') || err.message.includes('obrigatória')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.post('/ia/recomendacoes/:id/visualizado', async (req, res, next) => {
  try {
    const recomendacao = await IAService.marcarVisualizada(
      req.params.id,
      req.usuario.cliente_id
    );
    if (!recomendacao) return res.status(404).json({ error: 'Recomendação não encontrada' });
    res.json(recomendacao);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
