'use strict';

const { AuditLog, Usuario } = require('../models');
const { Op } = require('sequelize');

class AuditService {
  static async registrarAcao(usuarioId, clienteId, tabela, acao, dadosAntes = null, dadosDepois = null, req = null) {
    try {
      await AuditLog.create({
        usuario_id: usuarioId,
        cliente_id: clienteId,
        tabela,
        acao,
        dados_antes: dadosAntes,
        dados_depois: dadosDepois,
        ip_address: req?.ip || null,
        user_agent: req?.headers?.['user-agent'] || null,
      });
    } catch (error) {
      console.error('Erro registrando audit:', error.message);
    }
  }

  static async listarAudit(clienteId, filtros = {}) {
    const where = { cliente_id: clienteId };

    if (filtros.tabela) where.tabela = filtros.tabela;
    if (filtros.acao) where.acao = filtros.acao;
    if (filtros.usuarioId) where.usuario_id = parseInt(filtros.usuarioId, 10);

    return AuditLog.findAll({
      where,
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }],
      order: [['criado_em', 'DESC']],
      limit: Math.min(parseInt(filtros.limit, 10) || 100, 500),
      offset: parseInt(filtros.offset, 10) || 0,
    });
  }

  static async exportarAudit(clienteId) {
    const logs = await AuditLog.findAll({
      where: { cliente_id: clienteId },
      order: [['criado_em', 'DESC']],
    });

    return { dados: this.converterCSV(logs), total: logs.length };
  }

  static converterCSV(logs) {
    const headers = ['ID', 'Usuario', 'Tabela', 'Acao', 'Data', 'IP'];
    const rows = logs.map((log) => [
      log.id,
      log.usuario_id,
      log.tabela,
      log.acao,
      log.criado_em,
      log.ip_address,
    ]);
    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }
}

module.exports = AuditService;
