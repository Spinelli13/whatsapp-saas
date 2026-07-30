'use strict';

const { Usuario } = require('../models');
const { Op } = require('sequelize');

class AtendenteStatusService {
  static async obter(usuarioId) {
    const usuario = await Usuario.findByPk(usuarioId, {
      attributes: ['id', 'nome', 'email', 'status_atendente'],
    });
    if (!usuario) {
      const err = new Error('Usuário não encontrado');
      err.status = 404;
      throw err;
    }
    return usuario;
  }

  static async mudar(usuarioId, status) {
    const statusValidos = ['online', 'ausente', 'offline'];
    if (!statusValidos.includes(status)) {
      const err = new Error('Status inválido. Use: online, ausente ou offline');
      err.status = 400;
      throw err;
    }

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      const err = new Error('Usuário não encontrado');
      err.status = 404;
      throw err;
    }

    await usuario.update({ status_atendente: status });
    return usuario;
  }

  static async listarAtendentes(clienteId, statusFiltro = null) {
    const where = { cliente_id: clienteId };
    if (statusFiltro) {
      where.status_atendente = statusFiltro;
    }

    return Usuario.findAll({
      where,
      attributes: ['id', 'nome', 'email', 'role', 'status_atendente'],
      order: [['nome', 'ASC']],
    });
  }
}

module.exports = AtendenteStatusService;
