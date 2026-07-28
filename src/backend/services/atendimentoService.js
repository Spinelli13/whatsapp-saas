'use strict';

const { Atendimento, MessageQueue, Usuario } = require('../models');
const ChatbotService = require('./chatbotService');

class AtendimentoService {
  /**
   * Simula recebimento de mensagem WhatsApp.
   * Cria ou reutiliza atendimento ativo/pendente para o número.
   */
  static async receber(clienteId, numero, mensagem) {
    const analise = ChatbotService.analisar(mensagem);

    // Reaproveita atendimento em aberto para o mesmo número
    let atendimento = await Atendimento.findOne({
      where: {
        cliente_id: clienteId,
        numero_whatsapp: numero,
        status: ['pendente', 'ativo'],
      },
    });

    if (!atendimento) {
      atendimento = await Atendimento.create({
        cliente_id: clienteId,
        numero_whatsapp: numero,
        status: 'pendente',
        prioridade: analise.urgencia === 'alta' ? 'alta' : 'media',
        ultima_mensagem: mensagem,
      });
    } else {
      await atendimento.update({ ultima_mensagem: mensagem });
    }

    await MessageQueue.create({
      atendimento_id: atendimento.id,
      tipo: 'entrada',
      mensagem,
      timestamp: new Date(),
    });

    return { atendimento, analise };
  }

  /**
   * Envia mensagem para o cliente (registra na fila; disparo real via Baileys em produção).
   */
  static async enviar(atendimentoId, clienteId, mensagem) {
    const atendimento = await Atendimento.findOne({
      where: { id: atendimentoId, cliente_id: clienteId },
    });
    if (!atendimento) return null;

    const msg = await MessageQueue.create({
      atendimento_id: atendimentoId,
      tipo: 'saida',
      mensagem,
      timestamp: new Date(),
    });

    await atendimento.update({ ultima_mensagem: mensagem });

    // Em produção: await BaileysService.enviar(atendimento.numero_whatsapp, mensagem);

    return msg;
  }

  /**
   * Lista todos os atendimentos do cliente com filtros opcionais.
   */
  static async listar(clienteId, filtros = {}) {
    const where = { cliente_id: clienteId };
    if (filtros.status)    where.status    = filtros.status;
    if (filtros.prioridade) where.prioridade = filtros.prioridade;
    if (filtros.setor)     where.setor     = filtros.setor;

    return Atendimento.findAll({
      where,
      include: [{ model: Usuario, as: 'atendente', attributes: ['id', 'nome', 'email'] }],
      order: [['criado_em', 'DESC']],
    });
  }

  /**
   * Obtém um atendimento completo com histórico de mensagens.
   */
  static async obter(id, clienteId) {
    return Atendimento.findOne({
      where: { id, cliente_id: clienteId },
      include: [
        { model: Usuario, as: 'atendente', attributes: ['id', 'nome', 'email'] },
        {
          model: MessageQueue,
          as: 'mensagens',
          separate: true,
          order: [['timestamp', 'ASC']],
        },
      ],
    });
  }
}

module.exports = AtendimentoService;
