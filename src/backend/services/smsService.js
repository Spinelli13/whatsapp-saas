'use strict';

const { SMS, Usuario } = require('../models');

class SMSService {
  static async enviar(clienteId, dados, usuarioId) {
    const sms = await SMS.create({
      cliente_id: clienteId,
      usuario_id: usuarioId,
      status: 'rascunho',
      ...dados,
    });

    try {
      await sms.update({ status: 'enviando' });
      // Aqui iria integração Twilio real (config do cliente)
      await sms.update({ status: 'enviado', data_envio: new Date() });
    } catch (err) {
      await sms.update({ status: 'erro', erro_mensagem: err.message });
      throw err;
    }

    return SMSService.obter(sms.id, clienteId);
  }

  static async listar(clienteId, filtros = {}) {
    const where = { cliente_id: clienteId };
    if (filtros.tipo) where.tipo = filtros.tipo;
    if (filtros.status) where.status = filtros.status;

    return SMS.findAll({
      where,
      include: [{ model: Usuario, as: 'remetente', attributes: ['id', 'nome', 'email'] }],
      order: [['criado_em', 'DESC']],
      limit: filtros.limit ? Number(filtros.limit) : 50,
    });
  }

  static async obter(smsId, clienteId) {
    return SMS.findOne({
      where: { id: smsId, cliente_id: clienteId },
      include: [{ model: Usuario, as: 'remetente', attributes: ['id', 'nome', 'email'] }],
    });
  }

  static async deletar(smsId, clienteId) {
    return SMS.destroy({ where: { id: smsId, cliente_id: clienteId } });
  }
}

module.exports = SMSService;
