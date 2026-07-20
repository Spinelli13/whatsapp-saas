'use strict';

const { Email, Usuario } = require('../models');

class EmailService {
  static async enviar(clienteId, dados, usuarioId) {
    const email = await Email.create({
      cliente_id: clienteId,
      usuario_id: usuarioId,
      status: 'rascunho',
      ...dados,
    });

    try {
      await email.update({ status: 'enviando' });
      // Aqui iria integração SMTP real (nodemailer + config do cliente)
      await email.update({ status: 'enviado', data_envio: new Date() });
    } catch (err) {
      await email.update({ status: 'erro', erro_mensagem: err.message });
      throw err;
    }

    return EmailService.obter(email.id, clienteId);
  }

  static async listar(clienteId, filtros = {}) {
    const where = { cliente_id: clienteId };
    if (filtros.tipo) where.tipo = filtros.tipo;
    if (filtros.status) where.status = filtros.status;

    return Email.findAll({
      where,
      include: [{ model: Usuario, as: 'remetente', attributes: ['id', 'nome', 'email'] }],
      order: [['criado_em', 'DESC']],
      limit: filtros.limit ? Number(filtros.limit) : 50,
    });
  }

  static async obter(emailId, clienteId) {
    return Email.findOne({
      where: { id: emailId, cliente_id: clienteId },
      include: [{ model: Usuario, as: 'remetente', attributes: ['id', 'nome', 'email'] }],
    });
  }

  static async deletar(emailId, clienteId) {
    return Email.destroy({ where: { id: emailId, cliente_id: clienteId } });
  }
}

module.exports = EmailService;
