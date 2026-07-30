'use strict';
const { Router } = require('express');
const RelatorioService = require('../services/RelatorioService');
const { verificarJWT } = require('../middleware/auth');

const router = Router();

router.use(verificarJWT);

const parseDatas = (req, res) => {
  const { dataInicio, dataFim } = req.query;
  if (!dataInicio || !dataFim) {
    res.status(400).json({ erro: 'dataInicio e dataFim são obrigatórios' });
    return null;
  }
  return { inicio: new Date(dataInicio), fim: new Date(dataFim) };
};

// GET /api/relatorio/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const datas = parseDatas(req, res);
    if (!datas) return;
    const dashboard = await RelatorioService.dashboardCompleto(req.usuario.cliente_id, datas.inicio, datas.fim);
    res.json({ data: dashboard });
  } catch (err) { next(err); }
});

// GET /api/relatorio/tme
router.get('/tme', async (req, res, next) => {
  try {
    const datas = parseDatas(req, res);
    if (!datas) return;
    const tme = await RelatorioService.calcularTME(
      req.usuario.cliente_id, datas.inicio, datas.fim,
      req.query.usuarioId || null, req.query.departamentoId || null
    );
    res.json({ data: { tme_segundos: tme } });
  } catch (err) { next(err); }
});

// GET /api/relatorio/tma
router.get('/tma', async (req, res, next) => {
  try {
    const datas = parseDatas(req, res);
    if (!datas) return;
    const tma = await RelatorioService.calcularTMA(
      req.usuario.cliente_id, datas.inicio, datas.fim,
      req.query.usuarioId || null, req.query.departamentoId || null
    );
    res.json({ data: { tma_segundos: tma } });
  } catch (err) { next(err); }
});

// GET /api/relatorio/volume
router.get('/volume', async (req, res, next) => {
  try {
    const datas = parseDatas(req, res);
    if (!datas) return;
    const volume = await RelatorioService.calcularVolumePorPeriodo(
      req.usuario.cliente_id, datas.inicio, datas.fim, req.query.periodo || 'day'
    );
    res.json({ data: volume });
  } catch (err) { next(err); }
});

// GET /api/relatorio/atendentes
router.get('/atendentes', async (req, res, next) => {
  try {
    const datas = parseDatas(req, res);
    if (!datas) return;
    const performance = await RelatorioService.performanceAtendentes(
      req.usuario.cliente_id, datas.inicio, datas.fim, parseInt(req.query.limite, 10) || 10
    );
    res.json({ data: performance });
  } catch (err) { next(err); }
});

// GET /api/relatorio/departamentos
router.get('/departamentos', async (req, res, next) => {
  try {
    const datas = parseDatas(req, res);
    if (!datas) return;
    const performance = await RelatorioService.performanceDepartamentos(
      req.usuario.cliente_id, datas.inicio, datas.fim
    );
    res.json({ data: performance });
  } catch (err) { next(err); }
});

// GET /api/relatorio/satisfacao
router.get('/satisfacao', async (req, res, next) => {
  try {
    const datas = parseDatas(req, res);
    if (!datas) return;
    const satisfacao = await RelatorioService.satisfacaoMedia(req.usuario.cliente_id, datas.inicio, datas.fim);
    res.json({ data: satisfacao });
  } catch (err) { next(err); }
});

// POST /api/relatorio/avaliacao
router.post('/avaliacao', async (req, res, next) => {
  try {
    const { atendimento_id, nota_csat, nota_nps, comentario } = req.body;
    if (!atendimento_id || !nota_csat) {
      return res.status(400).json({ erro: 'atendimento_id e nota_csat são obrigatórios' });
    }
    const avaliacao = await RelatorioService.criarAvaliacao(
      atendimento_id, req.usuario.cliente_id, req.usuario.id, nota_csat, nota_nps, comentario
    );
    res.status(201).json({ data: avaliacao });
  } catch (err) { next(err); }
});

// GET /api/relatorio/export/csv
router.get('/export/csv', async (req, res, next) => {
  try {
    const datas = parseDatas(req, res);
    if (!datas) return;

    const dashboard = await RelatorioService.dashboardCompleto(req.usuario.cliente_id, datas.inicio, datas.fim);
    const { dataInicio, dataFim } = req.query;

    const linhasAtendentes = dashboard.top_atendentes.length
      ? dashboard.top_atendentes.map((a) =>
          `${a.usuario?.nome || 'N/A'},${a.total_atendimentos},${a.tma_segundos}s,${a.tme_segundos}s,${a.total_mensagens}`
        ).join('\n')
      : 'Sem dados';

    const csv = [
      'RELATÓRIO DE ATENDIMENTO',
      `Data: ${new Date().toLocaleString('pt-BR')}`,
      `Período: ${dataInicio} a ${dataFim}`,
      '',
      'MÉTRICAS GERAIS',
      `TME (Tempo Médio de Espera): ${dashboard.metricas_gerais.tme_segundos}s`,
      `TMA (Tempo Médio de Atendimento): ${dashboard.metricas_gerais.tma_segundos}s`,
      `Tempo Primeira Resposta: ${dashboard.metricas_gerais.tempo_primeira_resposta_segundos}s`,
      '',
      'SATISFAÇÃO',
      `CSAT Média: ${dashboard.satisfacao.csat_media}`,
      `NPS Média: ${dashboard.satisfacao.nps_media}`,
      `Total de Avaliações: ${dashboard.satisfacao.total_avaliacoes}`,
      '',
      'TOP ATENDENTES',
      'Nome,Total Atendimentos,TMA,TME,Mensagens',
      linhasAtendentes,
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) { next(err); }
});

module.exports = router;
