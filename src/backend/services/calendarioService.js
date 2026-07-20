'use strict';

const { CalendarioEvento, Tarefa, Usuario } = require('../models');
const { Op } = require('sequelize');

class CalendarioService {
  static async criar(clienteId, dados, usuarioId) {
    const evento = await CalendarioEvento.create({
      cliente_id: clienteId,
      usuario_id: usuarioId,
      ...dados,
    });
    return CalendarioService.obter(evento.id, clienteId);
  }

  static async listar(clienteId, filtros = {}) {
    const where = { cliente_id: clienteId };

    if (filtros.mes && filtros.ano) {
      const inicio = new Date(Number(filtros.ano), Number(filtros.mes) - 1, 1);
      const fim    = new Date(Number(filtros.ano), Number(filtros.mes), 0, 23, 59, 59);
      where.data_inicio = { [Op.between]: [inicio, fim] };
    }

    if (filtros.usuario_id) where.usuario_id = Number(filtros.usuario_id);
    if (filtros.tipo) where.tipo = filtros.tipo;

    return CalendarioEvento.findAll({
      where,
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] },
        { model: Tarefa,  as: 'tarefa',  attributes: ['id', 'titulo'] },
      ],
      order: [['data_inicio', 'ASC']],
    });
  }

  static async obter(eventoId, clienteId) {
    return CalendarioEvento.findOne({
      where: { id: eventoId, cliente_id: clienteId },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] },
        { model: Tarefa,  as: 'tarefa',  attributes: ['id', 'titulo'] },
      ],
    });
  }

  static async atualizar(eventoId, clienteId, dados) {
    const evento = await CalendarioEvento.findOne({ where: { id: eventoId, cliente_id: clienteId } });
    if (!evento) return null;
    await evento.update(dados);
    return CalendarioService.obter(eventoId, clienteId);
  }

  static async deletar(eventoId, clienteId) {
    return CalendarioEvento.destroy({ where: { id: eventoId, cliente_id: clienteId } });
  }

  static async proximosEventos(clienteId, dias = 7) {
    const agora  = new Date();
    const limite = new Date(agora.getTime() + Number(dias) * 24 * 60 * 60 * 1000);
    return CalendarioEvento.findAll({
      where: {
        cliente_id: clienteId,
        data_inicio: { [Op.between]: [agora, limite] },
      },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }],
      order: [['data_inicio', 'ASC']],
      limit: 20,
    });
  }
}

module.exports = CalendarioService;
