'use strict';

const { Transferencia, Atendimento, Usuario } = require('../models');

class TransferenciaService {
  static async solicitar({ atendimento_id, atendente_destino_id, motivo, departamento_destino_id }, usuario) {
    const atendimento = await Atendimento.findOne({
      where: { id: atendimento_id, cliente_id: usuario.cliente_id },
    });

    if (!atendimento) {
      const err = new Error('Atendimento não encontrado');
      err.status = 404;
      throw err;
    }

    if (atendimento.usuario_id !== usuario.id && usuario.role !== 'admin') {
      const err = new Error('Sem permissão para transferir este atendimento');
      err.status = 403;
      throw err;
    }

    if (Number(atendente_destino_id) === Number(usuario.id)) {
      const err = new Error('Não é possível transferir para si mesmo');
      err.status = 400;
      throw err;
    }

    const pendente = await Transferencia.findOne({
      where: { atendimento_id, status: 'pendente' },
    });

    if (pendente) {
      const err = new Error('Já existe uma transferência pendente para este atendimento');
      err.status = 409;
      throw err;
    }

    const atendenteDestino = await Usuario.findOne({
      where: { id: atendente_destino_id, cliente_id: usuario.cliente_id, status: 'ativo' },
    });

    if (!atendenteDestino) {
      const err = new Error('Atendente destino não encontrado');
      err.status = 404;
      throw err;
    }

    if (atendenteDestino.status_atendente === 'offline') {
      const err = new Error('Atendente destino indisponível ou offline');
      err.status = 400;
      throw err;
    }

    const transferencia = await Transferencia.create({
      atendimento_id,
      cliente_id: usuario.cliente_id,
      atendente_origem_id: usuario.id,
      atendente_destino_id,
      motivo: motivo || null,
      departamento_destino_id: departamento_destino_id || null,
      status: 'pendente',
    });

    return transferencia;
  }

  static async aceitar(id, usuario) {
    const transferencia = await Transferencia.findOne({
      where: { id, cliente_id: usuario.cliente_id },
    });

    if (!transferencia) {
      const err = new Error('Transferência não encontrada');
      err.status = 404;
      throw err;
    }

    if (transferencia.atendente_destino_id !== usuario.id && usuario.role !== 'admin') {
      const err = new Error('Apenas o atendente destino pode aceitar esta transferência');
      err.status = 403;
      throw err;
    }

    if (transferencia.status !== 'pendente') {
      const err = new Error(`Transferência já está com status '${transferencia.status}'`);
      err.status = 400;
      throw err;
    }

    await transferencia.update({ status: 'aceita' });

    await Atendimento.update(
      { usuario_id: transferencia.atendente_destino_id },
      { where: { id: transferencia.atendimento_id, cliente_id: usuario.cliente_id } }
    );

    return transferencia;
  }

  static async rejeitar(id, motivo, usuario) {
    const transferencia = await Transferencia.findOne({
      where: { id, cliente_id: usuario.cliente_id },
    });

    if (!transferencia) {
      const err = new Error('Transferência não encontrada');
      err.status = 404;
      throw err;
    }

    if (transferencia.atendente_destino_id !== usuario.id && usuario.role !== 'admin') {
      const err = new Error('Apenas o atendente destino pode rejeitar esta transferência');
      err.status = 403;
      throw err;
    }

    if (transferencia.status !== 'pendente') {
      const err = new Error(`Transferência já está com status '${transferencia.status}'`);
      err.status = 400;
      throw err;
    }

    await transferencia.update({ status: 'rejeitada', mensagem_rejeicao: motivo || null });
    return transferencia;
  }

  static async cancelar(id, usuario) {
    const transferencia = await Transferencia.findOne({
      where: { id, cliente_id: usuario.cliente_id },
    });

    if (!transferencia) {
      const err = new Error('Transferência não encontrada');
      err.status = 404;
      throw err;
    }

    if (transferencia.atendente_origem_id !== usuario.id && usuario.role !== 'admin') {
      const err = new Error('Apenas o atendente de origem pode cancelar esta transferência');
      err.status = 403;
      throw err;
    }

    if (transferencia.status !== 'pendente') {
      const err = new Error(`Transferência já está com status '${transferencia.status}'`);
      err.status = 400;
      throw err;
    }

    await transferencia.update({ status: 'cancelada' });
    return transferencia;
  }

  static async listar({ atendimento_id, status }, usuario) {
    const where = { cliente_id: usuario.cliente_id };

    if (atendimento_id) where.atendimento_id = atendimento_id;
    if (status) where.status = status;

    const transferencias = await Transferencia.findAll({
      where,
      include: [
        { model: Atendimento, as: 'atendimento', attributes: ['id', 'numero_whatsapp', 'nome_cliente', 'status'] },
        { model: Usuario,     as: 'origem',       attributes: ['id', 'nome', 'email'] },
        { model: Usuario,     as: 'destino',      attributes: ['id', 'nome', 'email'] },
      ],
      order: [['criado_em', 'DESC']],
    });

    return transferencias;
  }

  static async pendentesParaMim(usuario) {
    const transferencias = await Transferencia.findAll({
      where: { atendente_destino_id: usuario.id, cliente_id: usuario.cliente_id, status: 'pendente' },
      include: [
        { model: Atendimento, as: 'atendimento', attributes: ['id', 'numero_whatsapp', 'nome_cliente', 'status'] },
        { model: Usuario,     as: 'origem',       attributes: ['id', 'nome', 'email'] },
      ],
      order: [['criado_em', 'DESC']],
    });

    return transferencias;
  }
}

module.exports = TransferenciaService;
