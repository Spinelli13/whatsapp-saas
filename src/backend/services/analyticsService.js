'use strict';

const { MetricasVendas, Oportunidade } = require('../models');
const { Op } = require('sequelize');

class AnalyticsService {
  static async obterMetricasVendas(clienteId, dataInicio, dataFim) {
    return MetricasVendas.findAll({
      where: {
        cliente_id: clienteId,
        data: { [Op.between]: [dataInicio, dataFim] },
      },
      order: [['data', 'ASC']],
    });
  }

  static async calcularMetricasDiarias(clienteId, data = new Date()) {
    const dataStr = data.toISOString().split('T')[0];

    const oportunidades = await Oportunidade.findAll({
      where: { cliente_id: clienteId },
    });

    const total = oportunidades.length;
    const ganhas = oportunidades.filter((o) => o.status === 'ganha').length;
    const perdidas = oportunidades.filter((o) => o.status === 'perdida').length;
    const valorTotal = oportunidades.reduce((acc, o) => acc + parseFloat(o.valor || 0), 0);
    const valorGanho = oportunidades
      .filter((o) => o.status === 'ganha')
      .reduce((acc, o) => acc + parseFloat(o.valor || 0), 0);
    const valorPerdido = oportunidades
      .filter((o) => o.status === 'perdida')
      .reduce((acc, o) => acc + parseFloat(o.valor || 0), 0);

    const metrica = await MetricasVendas.create({
      cliente_id: clienteId,
      data: dataStr,
      total_oportunidades: total,
      oportunidades_ganhas: ganhas,
      oportunidades_perdidas: perdidas,
      valor_total: valorTotal,
      valor_ganho: valorGanho,
      valor_perdido: valorPerdido,
      taxa_conversao: total > 0 ? parseFloat(((ganhas / total) * 100).toFixed(2)) : 0,
      ticket_medio: ganhas > 0 ? parseFloat((valorGanho / ganhas).toFixed(2)) : 0,
    });

    return metrica;
  }

  static async obterTendencias(clienteId, dias = 30) {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    const metricas = await AnalyticsService.obterMetricasVendas(
      clienteId,
      dataInicio,
      new Date()
    );

    const tendencia = metricas.length > 1
      ? parseFloat(metricas[metricas.length - 1].total_oportunidades) >=
        parseFloat(metricas[0].total_oportunidades)
        ? 'crescente'
        : 'decrescente'
      : 'estavel';

    return {
      periodo: dias,
      tendencia,
      metricas,
    };
  }
}

module.exports = AnalyticsService;
