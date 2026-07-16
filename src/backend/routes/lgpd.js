'use strict';

const express = require('express');
const router = express.Router();
const { verificarJWT, apenasAdmin } = require('../middleware/auth');
const AuditService = require('../services/auditService');
const DataRetentionService = require('../services/dataRetentionService');
const DataExportService = require('../services/dataExportService');

// ── Audit Trail ───────────────────────────────────────────────────────────────

router.get('/audit/logs', verificarJWT, apenasAdmin, async (req, res, next) => {
  try {
    const logs = await AuditService.listarAudit(req.usuario.cliente_id, {
      limit: req.query.limit,
      offset: req.query.offset,
      tabela: req.query.tabela,
      acao: req.query.acao,
      usuarioId: req.query.usuario_id,
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// ── Políticas de Retenção ─────────────────────────────────────────────────────

router.get('/admin/retention-policy', verificarJWT, apenasAdmin, async (req, res, next) => {
  try {
    const politica = await DataRetentionService.obterPolitica(req.usuario.cliente_id);
    res.json(politica);
  } catch (err) {
    next(err);
  }
});

router.put('/admin/retention-policy', verificarJWT, apenasAdmin, async (req, res, next) => {
  try {
    const politica = await DataRetentionService.atualizarPolitica(req.usuario.cliente_id, req.body);
    res.json(politica);
  } catch (err) {
    next(err);
  }
});

// ── Exportação de Dados (LGPD) ────────────────────────────────────────────────

router.post('/data/exportar', verificarJWT, async (req, res, next) => {
  try {
    const exportacao = await DataExportService.solicitarExportacao(
      req.usuario.id,
      req.usuario.cliente_id
    );
    res.json({
      mensagem: 'Exportação solicitada. Você receberá um email quando estiver pronta.',
      exportacao_id: exportacao.id,
    });
  } catch (err) {
    if (err.message === 'Já existe exportação em andamento') {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/data/exportacoes', verificarJWT, async (req, res, next) => {
  try {
    const exportacoes = await DataExportService.listarExportacoes(
      req.usuario.id,
      req.usuario.cliente_id
    );
    res.json(exportacoes);
  } catch (err) {
    next(err);
  }
});

router.post('/data/solicitar-delecao', verificarJWT, async (req, res, next) => {
  try {
    const resultado = await DataExportService.solicitarDelecao(
      req.usuario.id,
      req.usuario.cliente_id
    );
    res.json(resultado);
  } catch (err) {
    if (err.message === 'Usuário não encontrado') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
