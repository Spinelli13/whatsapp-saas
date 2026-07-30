'use strict';
const { sequelize, MetricaAtendimento, Avaliacao, Usuario, Departamento } = require('../models');
const { Op } = require('sequelize');

class RelatorioService {
  static async calcularTME(clienteId, dataInicio, dataFim, usuarioId = null, departamentoId = null) {
    const where = {
      cliente_id: clienteId,
      criado_em: { [Op.between]: [dataInicio, dataFim] },
    };
    if (usuarioId) where.usuario_id = usuarioId;
    if (departamentoId) where.departamento_id = departamentoId;

    const metricas = await MetricaAtendimento.findAll({ where, attributes: ['tempo_espera_ms'] });
    if (!metricas.length) return 0;

    const totalEspera = metricas.reduce((sum, m) => sum + (m.tempo_espera_ms || 0), 0);
    return Math.round(totalEspera / metricas.length / 1000);
  }

  static async calcularTMA(clienteId, dataInicio, dataFim, usuarioId = null, departamentoId = null) {
    const where = {
      cliente_id: clienteId,
      criado_em: { [Op.between]: [dataInicio, dataFim] },
      finalizado: true,
    };
    if (usuarioId) where.usuario_id = usuarioId;
    if (departamentoId) where.departamento_id = departamentoId;

    const metricas = await MetricaAtendimento.findAll({ where, attributes: ['tempo_atendimento_ms'] });
    if (!metricas.length) return 0;

    const total = metricas.reduce((sum, m) => sum + (m.tempo_atendimento_ms || 0), 0);
    return Math.round(total / metricas.length / 1000);
  }

  static async calcularTempoFirstResponse(clienteId, dataInicio, dataFim) {
    const metricas = await MetricaAtendimento.findAll({
      where: {
        cliente_id: clienteId,
        criado_em: { [Op.between]: [dataInicio, dataFim] },
        tempo_primeira_resposta_ms: { [Op.not]: null },
      },
      attributes: ['tempo_primeira_resposta_ms'],
    });
    if (!metricas.length) return 0;

    const total = metricas.reduce((sum, m) => sum + (m.tempo_primeira_resposta_ms || 0), 0);
    return Math.round(total / metricas.length / 1000);
  }

  static async calcularVolumePorPeriodo(clienteId, dataInicio, dataFim, periodType = 'day') {
    const validPeriods = ['day', 'week', 'month', 'hour'];
    const period = validPeriods.includes(periodType) ? periodType : 'day';

    const metricas = await MetricaAtendimento.findAll({
      where: {
        cliente_id: clienteId,
        criado_em: { [Op.between]: [dataInicio, dataFim] },
      },
      attributes: [
        [sequelize.fn('DATE_TRUNC', period, sequelize.col('criado_em')), 'periodo'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
      ],
      group: [sequelize.fn('DATE_TRUNC', period, sequelize.col('criado_em'))],
      order: [[sequelize.fn('DATE_TRUNC', period, sequelize.col('criado_em')), 'ASC']],
      raw: true,
    });

    return metricas.map((m) => ({
      periodo: m.periodo,
      total: parseInt(m.total, 10),
    }));
  }

  static async performanceAtendentes(clienteId, dataInicio, dataFim, limite = 10) {
    const metricas = await MetricaAtendimento.findAll({
      where: {
        cliente_id: clienteId,
        criado_em: { [Op.between]: [dataInicio, dataFim] },
        finalizado: true,
      },
      attributes: [
        'usuario_id',
        [sequelize.fn('COUNT', sequelize.col('MetricaAtendimento.id')), 'total_atendimentos'],
        [sequelize.fn('AVG', sequelize.col('tempo_atendimento_ms')), 'tma_ms'],
        [sequelize.fn('AVG', sequelize.col('tempo_espera_ms')), 'tme_ms'],
        [sequelize.fn('SUM', sequelize.col('mensagens_total')), 'total_mensagens'],
      ],
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nome', 'email'],
        },
      ],
      group: ['MetricaAtendimento.usuario_id', 'usuario.id'],
      subQuery: false,
      order: [[sequelize.literal('tma_ms'), 'ASC']],
      limit: limite,
    });

    return metricas.map((m) => ({
      usuario_id: m.usuario_id,
      usuario: m.usuario ? { id: m.usuario.id, nome: m.usuario.nome, email: m.usuario.email } : null,
      total_atendimentos: parseInt(m.dataValues.total_atendimentos, 10) || 0,
      tma_segundos: Math.round((parseFloat(m.dataValues.tma_ms) || 0) / 1000),
      tme_segundos: Math.round((parseFloat(m.dataValues.tme_ms) || 0) / 1000),
      total_mensagens: parseInt(m.dataValues.total_mensagens, 10) || 0,
    }));
  }

  static async performanceDepartamentos(clienteId, dataInicio, dataFim) {
    const metricas = await MetricaAtendimento.findAll({
      where: {
        cliente_id: clienteId,
        criado_em: { [Op.between]: [dataInicio, dataFim] },
        finalizado: true,
        departamento_id: { [Op.not]: null },
      },
      attributes: [
        'departamento_id',
        [sequelize.fn('COUNT', sequelize.col('MetricaAtendimento.id')), 'total'],
        [sequelize.fn('AVG', sequelize.col('tempo_atendimento_ms')), 'tma_ms'],
      ],
      include: [
        {
          model: Departamento,
          as: 'departamento',
          attributes: ['id', 'nome'],
        },
      ],
      group: ['MetricaAtendimento.departamento_id', 'departamento.id'],
      subQuery: false,
      order: [[sequelize.literal('tma_ms'), 'ASC']],
    });

    return metricas.map((m) => ({
      departamento_id: m.departamento_id,
      departamento: m.departamento ? { id: m.departamento.id, nome: m.departamento.nome } : null,
      total: parseInt(m.dataValues.total, 10) || 0,
      tma_segundos: Math.round((parseFloat(m.dataValues.tma_ms) || 0) / 1000),
    }));
  }

  static async satisfacaoMedia(clienteId, dataInicio, dataFim) {
    const resultado = await Avaliacao.findOne({
      where: {
        cliente_id: clienteId,
        criado_em: { [Op.between]: [dataInicio, dataFim] },
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('nota_csat')), 'csat_media'],
        [sequelize.fn('AVG', sequelize.col('nota_nps')),  'nps_media'],
        [sequelize.fn('COUNT', sequelize.col('id')),      'total_avaliacoes'],
      ],
      raw: true,
    });

    return {
      csat_media:        resultado?.csat_media ? parseFloat(resultado.csat_media).toFixed(2) : '0.00',
      nps_media:         resultado?.nps_media  ? parseFloat(resultado.nps_media).toFixed(2)  : '0.00',
      total_avaliacoes:  parseInt(resultado?.total_avaliacoes, 10) || 0,
    };
  }

  static async dashboardCompleto(clienteId, dataInicio, dataFim) {
    const [tme, tma, primeiraResposta, volume, performanceAts, performanceDepts, satisfacao] =
      await Promise.all([
        this.calcularTME(clienteId, dataInicio, dataFim),
        this.calcularTMA(clienteId, dataInicio, dataFim),
        this.calcularTempoFirstResponse(clienteId, dataInicio, dataFim),
        this.calcularVolumePorPeriodo(clienteId, dataInicio, dataFim, 'day'),
        this.performanceAtendentes(clienteId, dataInicio, dataFim, 5),
        this.performanceDepartamentos(clienteId, dataInicio, dataFim),
        this.satisfacaoMedia(clienteId, dataInicio, dataFim),
      ]);

    return {
      metricas_gerais: {
        tme_segundos: tme,
        tma_segundos: tma,
        tempo_primeira_resposta_segundos: primeiraResposta,
      },
      volume_por_periodo: volume,
      top_atendentes: performanceAts,
      performance_departamentos: performanceDepts,
      satisfacao,
    };
  }

  // ── CRUD Avaliações ──────────────────────────────────────────────────────────

  static async criarAvaliacao(atendimentoId, clienteId, usuarioId, notaCsat, notaNps, comentario) {
    if (!notaCsat || notaCsat < 1 || notaCsat > 5) {
      const err = new Error('nota_csat deve ser entre 1 e 5');
      err.status = 400;
      throw err;
    }
    return Avaliacao.create({
      atendimento_id: atendimentoId,
      cliente_id: clienteId,
      usuario_id: usuarioId,
      nota_csat: notaCsat,
      nota_nps: notaNps || null,
      comentario: comentario || null,
    });
  }

  static async obterAvaliacao(atendimentoId) {
    return Avaliacao.findOne({ where: { atendimento_id: atendimentoId } });
  }

  // ── Registro de métricas ─────────────────────────────────────────────────────

  static async registrarMetrica(atendimentoId, clienteId, usuarioId, dados) {
    return MetricaAtendimento.create({
      atendimento_id: atendimentoId,
      cliente_id: clienteId,
      usuario_id: usuarioId,
      departamento_id: dados.departamento_id || null,
      tempo_espera_ms: dados.tempo_espera_ms || 0,
      tempo_atendimento_ms: dados.tempo_atendimento_ms || 0,
      tempo_primeira_resposta_ms: dados.tempo_primeira_resposta_ms || null,
      mensagens_total: dados.mensagens_total || 0,
      transferencias: dados.transferencias || 0,
    });
  }

  static async finalizarMetrica(atendimentoId, tempo_atendimento_ms) {
    const metrica = await MetricaAtendimento.findOne({ where: { atendimento_id: atendimentoId } });
    if (metrica) {
      await metrica.update({ tempo_atendimento_ms, finalizado: true });
    }
  }
}

module.exports = RelatorioService;
