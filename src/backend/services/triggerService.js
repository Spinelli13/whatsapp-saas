'use strict';

const { Trigger, Workflow } = require('../models');

class TriggerService {
  static async criar(workflowId, dados) {
    if (!dados.tipo) throw new Error('Tipo de trigger é obrigatório');

    const trigger = await Trigger.create({
      workflow_id: workflowId,
      ...dados,
    });

    return TriggerService.obter(trigger.id);
  }

  static async listar(workflowId) {
    return Trigger.findAll({
      where: { workflow_id: workflowId },
      order: [['criado_em', 'DESC']],
    });
  }

  static async obter(triggerId) {
    return Trigger.findOne({
      where: { id: triggerId },
      include: [{ model: Workflow, as: 'workflow' }],
    });
  }

  static async atualizar(triggerId, dados) {
    const trigger = await TriggerService.obter(triggerId);
    if (!trigger) return null;

    await trigger.update(dados);
    return TriggerService.obter(triggerId);
  }

  static async deletar(triggerId) {
    return Trigger.destroy({ where: { id: triggerId } });
  }
}

module.exports = TriggerService;
