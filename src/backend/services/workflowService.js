'use strict';

const { Workflow, Trigger, AcaoAutomacao, ExecucaoWorkflow } = require('../models');

class WorkflowService {
  static async criar(clienteId, dados) {
    if (!dados.nome) throw new Error('Nome é obrigatório');
    if (!dados.tipo) throw new Error('Tipo é obrigatório');

    const workflow = await Workflow.create({
      cliente_id: clienteId,
      ...dados,
    });

    return WorkflowService.obter(workflow.id, clienteId);
  }

  static async listar(clienteId, filtros = {}) {
    const where = { cliente_id: clienteId };
    if (filtros.status) where.status = filtros.status;
    if (filtros.tipo) where.tipo = filtros.tipo;

    return Workflow.findAll({
      where,
      include: [
        { model: Trigger, as: 'triggers' },
        { model: AcaoAutomacao, as: 'acoes', separate: true, order: [['sequencia', 'ASC']] },
      ],
      order: [['criado_em', 'DESC']],
      limit: filtros.limit ? parseInt(filtros.limit, 10) : 50,
    });
  }

  static async obter(workflowId, clienteId) {
    return Workflow.findOne({
      where: { id: workflowId, cliente_id: clienteId },
      include: [
        { model: Trigger, as: 'triggers' },
        { model: AcaoAutomacao, as: 'acoes', separate: true, order: [['sequencia', 'ASC']] },
        { model: ExecucaoWorkflow, as: 'execucoes', separate: true, limit: 10, order: [['criado_em', 'DESC']] },
      ],
    });
  }

  static async atualizar(workflowId, clienteId, dados) {
    const workflow = await WorkflowService.obter(workflowId, clienteId);
    if (!workflow) return null;

    await workflow.update(dados);
    return WorkflowService.obter(workflowId, clienteId);
  }

  static async alterarStatus(workflowId, clienteId, novoStatus) {
    if (!['ativo', 'inativo', 'pausado'].includes(novoStatus)) {
      throw new Error('Status inválido');
    }

    const workflow = await WorkflowService.obter(workflowId, clienteId);
    if (!workflow) return null;

    await workflow.update({ status: novoStatus });
    return WorkflowService.obter(workflowId, clienteId);
  }

  static async deletar(workflowId, clienteId) {
    return Workflow.destroy({
      where: { id: workflowId, cliente_id: clienteId },
    });
  }

  static async obterEstatisticas(clienteId) {
    const [total, ativos, execucoes, sucessos] = await Promise.all([
      Workflow.count({ where: { cliente_id: clienteId } }),
      Workflow.count({ where: { cliente_id: clienteId, status: 'ativo' } }),
      ExecucaoWorkflow.count({ where: { cliente_id: clienteId } }),
      ExecucaoWorkflow.count({ where: { cliente_id: clienteId, status: 'sucesso' } }),
    ]);

    return {
      total,
      ativos,
      execucoes,
      sucessos,
      taxaSucesso: execucoes > 0 ? parseFloat(((sucessos / execucoes) * 100).toFixed(1)) : 0,
    };
  }
}

module.exports = WorkflowService;
