'use strict';

const { Atendimento, MessageQueue, Oportunidade, EstagioPipeline } = require('../models');
const { Op } = require('sequelize');

class FilaAtendimentoService {
  /**
   * Adiciona atendimento à fila de um setor específico.
   */
  static async adicionar(atendimentoId, clienteId, setor) {
    const atendimento = await Atendimento.findOne({ where: { id: atendimentoId, cliente_id: clienteId } });
    if (!atendimento) return null;
    await atendimento.update({ setor, status: 'pendente' });
    return atendimento;
  }

  /**
   * Lista atendimentos pendentes, opcionalmente filtrados por setor.
   * Ordena por prioridade (alta primeiro) e depois por data de criação.
   */
  static async listar(clienteId, setor = null) {
    const where = { cliente_id: clienteId, status: 'pendente' };
    if (setor) where.setor = setor;

    return Atendimento.findAll({
      where,
      order: [
        ['prioridade', 'DESC'],
        ['criado_em',  'ASC'],
      ],
    });
  }

  /**
   * Agente pega um atendimento da fila — altera status para 'ativo'.
   * Garante multi-tenant: atendimento deve pertencer ao cliente do usuário.
   */
  static async pegar(atendimentoId, clienteId, usuarioId) {
    const atendimento = await Atendimento.findOne({
      where: { id: atendimentoId, cliente_id: clienteId, status: 'pendente' },
    });
    if (!atendimento) return null;

    await atendimento.update({ status: 'ativo', usuario_id: usuarioId });
    return atendimento;
  }

  /**
   * Registra mensagem de saída (agente → cliente).
   */
  static async enviarMensagem(atendimentoId, clienteId, mensagem) {
    const atendimento = await Atendimento.findOne({ where: { id: atendimentoId, cliente_id: clienteId } });
    if (!atendimento) return null;

    const msg = await MessageQueue.create({
      atendimento_id: atendimentoId,
      tipo: 'saida',
      mensagem,
      timestamp: new Date(),
    });
    await atendimento.update({ ultima_mensagem: mensagem });
    return msg;
  }

  /**
   * Mescla dados adicionais do cliente no campo JSONB dados_cliente.
   */
  static async marcarDados(atendimentoId, clienteId, dados) {
    const atendimento = await Atendimento.findOne({ where: { id: atendimentoId, cliente_id: clienteId } });
    if (!atendimento) return null;

    const dadosAtuais = atendimento.dados_cliente || {};
    await atendimento.update({ dados_cliente: { ...dadosAtuais, ...dados } });
    return atendimento;
  }

  /**
   * Encaminha atendimento para vendas criando uma Oportunidade no pipeline.
   * Usa o primeiro estágio ativo do pipeline do cliente.
   */
  static async encaminharVenda(atendimentoId, clienteId, dadosVenda = {}) {
    const atendimento = await Atendimento.findOne({ where: { id: atendimentoId, cliente_id: clienteId } });
    if (!atendimento) return null;

    const estagio = await EstagioPipeline.findOne({
      where: { cliente_id: clienteId, ativo: true },
      order: [['ordem', 'ASC']],
    });

    const oportunidade = await Oportunidade.create({
      cliente_id: clienteId,
      titulo:     dadosVenda.titulo || `Lead WhatsApp — ${atendimento.numero_whatsapp}`,
      valor:      dadosVenda.valor  || 0,
      estagio_id: estagio?.id,
      usuario_id: atendimento.usuario_id,
      status:     'aberta',
      descricao:  `Encaminhado do atendimento WhatsApp ${atendimento.numero_whatsapp}`,
      posicao_coluna: 0,
    });

    return oportunidade;
  }

  /**
   * Encerra o atendimento (status → encerrado).
   */
  static async encerrar(atendimentoId, clienteId) {
    const atendimento = await Atendimento.findOne({ where: { id: atendimentoId, cliente_id: clienteId } });
    if (!atendimento) return null;
    await atendimento.update({ status: 'encerrado' });
    return atendimento;
  }

  /**
   * Registra feedback do cliente (score 1-5) após encerramento.
   */
  static async feedback(atendimentoId, clienteId, score) {
    const atendimento = await Atendimento.findOne({ where: { id: atendimentoId, cliente_id: clienteId } });
    if (!atendimento) return null;
    await atendimento.update({ feedback_score: score });
    return atendimento;
  }

  /**
   * Retorna métricas consolidadas para o dashboard de atendimento.
   */
  static async dashboard(clienteId) {
    const [total, pendentes, ativos, encerrados, avaliacoes] = await Promise.all([
      Atendimento.count({ where: { cliente_id: clienteId } }),
      Atendimento.count({ where: { cliente_id: clienteId, status: 'pendente' } }),
      Atendimento.count({ where: { cliente_id: clienteId, status: 'ativo' } }),
      Atendimento.count({ where: { cliente_id: clienteId, status: 'encerrado' } }),
      Atendimento.findAll({
        where: { cliente_id: clienteId, feedback_score: { [Op.not]: null } },
        attributes: ['feedback_score'],
      }),
    ]);

    const satisfacao_media = avaliacoes.length
      ? parseFloat(
          (avaliacoes.reduce((acc, a) => acc + a.feedback_score, 0) / avaliacoes.length).toFixed(1)
        )
      : null;

    return { total, pendentes, ativos, encerrados, satisfacao_media };
  }
}

module.exports = FilaAtendimentoService;
