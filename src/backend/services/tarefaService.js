'use strict';

const { Tarefa, CalendarioEvento, Usuario } = require('../models');
const { Op } = require('sequelize');

class TarefaService {
  static async criar(clienteId, dados, usuarioId) {
    const tarefa = await Tarefa.create({
      cliente_id: clienteId,
      usuario_criador_id: usuarioId,
      ...dados,
    });
    return TarefaService.obter(tarefa.id, clienteId);
  }

  static async listar(clienteId, filtros = {}) {
    const where = { cliente_id: clienteId };
    if (filtros.status) where.status = filtros.status;
    if (filtros.prioridade) where.prioridade = filtros.prioridade;
    if (filtros.usuario_atribuido_id) where.usuario_atribuido_id = Number(filtros.usuario_atribuido_id);
    if (filtros.apenas_minhas === 'true' && filtros.usuario_id) {
      where.usuario_atribuido_id = Number(filtros.usuario_id);
    }

    return Tarefa.findAll({
      where,
      include: [
        { model: Usuario, as: 'usuarioAtribuido', attributes: ['id', 'nome', 'email'] },
        { model: Usuario, as: 'usuarioCriador',   attributes: ['id', 'nome', 'email'] },
      ],
      order: [
        ['data_vencimento', 'ASC NULLS LAST'],
        ['criado_em', 'DESC'],
      ],
      limit: filtros.limit ? Number(filtros.limit) : 100,
    });
  }

  static async obter(tarefaId, clienteId) {
    return Tarefa.findOne({
      where: { id: tarefaId, cliente_id: clienteId },
      include: [
        { model: Usuario, as: 'usuarioAtribuido', attributes: ['id', 'nome', 'email'] },
        { model: Usuario, as: 'usuarioCriador',   attributes: ['id', 'nome', 'email'] },
        { model: CalendarioEvento, as: 'eventos', attributes: ['id', 'titulo', 'data_inicio', 'tipo'] },
      ],
    });
  }

  static async atualizar(tarefaId, clienteId, dados) {
    const tarefa = await Tarefa.findOne({ where: { id: tarefaId, cliente_id: clienteId } });
    if (!tarefa) return null;
    await tarefa.update(dados);
    return TarefaService.obter(tarefaId, clienteId);
  }

  static async mudarStatus(tarefaId, clienteId, novoStatus) {
    const tarefa = await Tarefa.findOne({ where: { id: tarefaId, cliente_id: clienteId } });
    if (!tarefa) return null;

    const atualizacoes = { status: novoStatus };
    if (novoStatus === 'concluida') atualizacoes.data_conclusao = new Date();
    else if (novoStatus === 'em_progresso' && !tarefa.data_inicio) atualizacoes.data_inicio = new Date();

    await tarefa.update(atualizacoes);
    return TarefaService.obter(tarefaId, clienteId);
  }

  static async atribuir(tarefaId, clienteId, usuarioAtribuidoId) {
    return TarefaService.atualizar(tarefaId, clienteId, { usuario_atribuido_id: usuarioAtribuidoId });
  }

  static async metricas(clienteId) {
    const where = { cliente_id: clienteId };

    const [total, concluidas, emProgresso, vencidas] = await Promise.all([
      Tarefa.count({ where }),
      Tarefa.count({ where: { ...where, status: 'concluida' } }),
      Tarefa.count({ where: { ...where, status: 'em_progresso' } }),
      Tarefa.count({
        where: {
          ...where,
          status: { [Op.ne]: 'concluida' },
          data_vencimento: { [Op.lt]: new Date() },
        },
      }),
    ]);

    return {
      total,
      concluidas,
      emProgresso,
      vencidas,
      taxaConclusao: total > 0 ? Number(((concluidas / total) * 100).toFixed(1)) : 0,
    };
  }

  static async deletar(tarefaId, clienteId) {
    return Tarefa.destroy({ where: { id: tarefaId, cliente_id: clienteId } });
  }
}

module.exports = TarefaService;
