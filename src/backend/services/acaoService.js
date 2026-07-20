'use strict';

const { AcaoAutomacao, Workflow } = require('../models');

class AcaoService {
  static async criar(workflowId, dados) {
    if (!dados.tipo) throw new Error('Tipo de ação é obrigatório');
    if (dados.sequencia === undefined || dados.sequencia === null) {
      throw new Error('Sequência é obrigatória');
    }

    const acao = await AcaoAutomacao.create({
      workflow_id: workflowId,
      ...dados,
    });

    return AcaoService.obter(acao.id);
  }

  static async listar(workflowId) {
    return AcaoAutomacao.findAll({
      where: { workflow_id: workflowId },
      order: [['sequencia', 'ASC']],
    });
  }

  static async obter(acaoId) {
    return AcaoAutomacao.findOne({
      where: { id: acaoId },
      include: [{ model: Workflow, as: 'workflow' }],
    });
  }

  static async atualizar(acaoId, dados) {
    const acao = await AcaoService.obter(acaoId);
    if (!acao) return null;

    await acao.update(dados);
    return AcaoService.obter(acaoId);
  }

  static async deletar(acaoId) {
    return AcaoAutomacao.destroy({ where: { id: acaoId } });
  }
}

module.exports = AcaoService;
