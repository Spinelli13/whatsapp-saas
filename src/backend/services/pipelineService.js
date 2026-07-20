'use strict';

const { EstagioPipeline, Oportunidade } = require('../models');

class PipelineService {
  static async listarEstagios(clienteId) {
    return EstagioPipeline.findAll({
      where: { cliente_id: clienteId, ativo: true },
      order: [['ordem', 'ASC']],
    });
  }

  static async criarEstagio(clienteId, dados) {
    const max = await EstagioPipeline.max('ordem', { where: { cliente_id: clienteId } });
    return EstagioPipeline.create({
      cliente_id: clienteId,
      ordem: (max || 0) + 1,
      ...dados,
    });
  }

  static async atualizarEstagio(estagioId, clienteId, dados) {
    const estagio = await EstagioPipeline.findOne({ where: { id: estagioId, cliente_id: clienteId } });
    if (!estagio) return null;
    return estagio.update(dados);
  }

  static async deletarEstagio(estagioId, clienteId) {
    return EstagioPipeline.destroy({ where: { id: estagioId, cliente_id: clienteId } });
  }

  static async obterPipelineCompleto(clienteId) {
    const estagios = await EstagioPipeline.findAll({
      where: { cliente_id: clienteId, ativo: true },
      order: [['ordem', 'ASC']],
    });

    return Promise.all(
      estagios.map(async (estagio) => {
        const oportunidades = await Oportunidade.findAll({
          where: { cliente_id: clienteId, estagio_id: estagio.id },
          order: [['posicao_coluna', 'ASC']],
          attributes: ['id', 'titulo', 'valor', 'probabilidade', 'data_fechamento_esperada', 'status'],
        });
        const valor_total = oportunidades.reduce(
          (acc, o) => acc + parseFloat(o.valor || 0),
          0
        );
        return { ...estagio.toJSON(), oportunidades, total: oportunidades.length, valor_total };
      })
    );
  }
}

module.exports = PipelineService;
