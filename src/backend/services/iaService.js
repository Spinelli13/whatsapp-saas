'use strict';

const { PrevisaoIA, RecomendacaoIA, Oportunidade } = require('../models');

class IAService {
  static async obterPrevisoes(clienteId, oportunidadeId = null) {
    const where = { cliente_id: clienteId };
    if (oportunidadeId) where.oportunidade_id = oportunidadeId;

    return PrevisaoIA.findAll({
      where,
      include: [{ model: Oportunidade, as: 'oportunidade' }],
      order: [['criado_em', 'DESC']],
      limit: 20,
    });
  }

  static async gerarPrevisao(clienteId, oportunidade) {
    const predicao = IAService.calcularProbabilidade(oportunidade);

    return PrevisaoIA.create({
      cliente_id: clienteId,
      oportunidade_id: oportunidade.id,
      tipo: 'probabilidade_ganho',
      predicao: predicao.probabilidade,
      confianca: predicao.confianca,
      fatores: predicao.fatores,
    });
  }

  static calcularProbabilidade(oportunidade) {
    let probabilidade = parseFloat(oportunidade.probabilidade) || 50;
    const fatores = [];

    if (parseFloat(oportunidade.valor) > 10000) {
      probabilidade += 15;
      fatores.push('Valor alto');
    }

    if (oportunidade.data_vencimento) {
      const dias = Math.floor(
        (new Date(oportunidade.data_vencimento) - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (dias < 7 && dias >= 0) {
        probabilidade += 10;
        fatores.push('Urgência');
      }
    }

    return {
      probabilidade: Math.min(99, Math.max(1, probabilidade)),
      confianca: 0.72,
      fatores,
    };
  }

  static async obterRecomendacoes(clienteId, usuarioId) {
    return RecomendacaoIA.findAll({
      where: { cliente_id: clienteId, usuario_id: usuarioId, visualizado: false },
      order: [['criado_em', 'DESC']],
      limit: 10,
    });
  }

  static async criarRecomendacao(clienteId, usuarioId, dados) {
    if (!dados.titulo) throw new Error('Título é obrigatório');
    if (!dados.descricao) throw new Error('Descrição é obrigatória');

    return RecomendacaoIA.create({
      cliente_id: clienteId,
      usuario_id: usuarioId,
      ...dados,
    });
  }

  static async marcarVisualizada(recomendacaoId, clienteId) {
    const recom = await RecomendacaoIA.findOne({
      where: { id: recomendacaoId, cliente_id: clienteId },
    });

    if (!recom) return null;

    await recom.update({ visualizado: true });
    return recom;
  }
}

module.exports = IAService;
