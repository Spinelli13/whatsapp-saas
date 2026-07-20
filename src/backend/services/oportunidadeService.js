'use strict';

const { Oportunidade, EstagioPipeline, HistoricoOportunidade, Usuario } = require('../models');

class OportunidadeService {
  static async criar(clienteId, dados, usuarioId) {
    const oportunidade = await Oportunidade.create({
      cliente_id: clienteId,
      usuario_id: usuarioId,
      ...dados,
    });
    await OportunidadeService._registrarHistorico(oportunidade.id, usuarioId, 'criada');
    return oportunidade;
  }

  static async listar(clienteId, filtros = {}) {
    const where = { cliente_id: clienteId };
    if (filtros.status) where.status = filtros.status;
    if (filtros.usuario_id) where.usuario_id = Number(filtros.usuario_id);
    if (filtros.estagio_id) where.estagio_id = filtros.estagio_id;

    return Oportunidade.findAll({
      where,
      include: [
        { model: EstagioPipeline, as: 'estagio', attributes: ['id', 'nome', 'cor'] },
        { model: Usuario, as: 'responsavel', attributes: ['id', 'nome', 'email'] },
      ],
      order: [
        ['posicao_coluna', 'ASC'],
        ['criado_em', 'DESC'],
      ],
      limit: filtros.limit ? Number(filtros.limit) : 100,
    });
  }

  static async obter(oportunidadeId, clienteId) {
    return Oportunidade.findOne({
      where: { id: oportunidadeId, cliente_id: clienteId },
      include: [
        { model: EstagioPipeline, as: 'estagio', attributes: ['id', 'nome', 'cor'] },
        { model: Usuario, as: 'responsavel', attributes: ['id', 'nome', 'email'] },
        {
          model: HistoricoOportunidade,
          as: 'historico',
          include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }],
          order: [['criado_em', 'DESC']],
          limit: 20,
        },
      ],
    });
  }

  static async atualizar(oportunidadeId, clienteId, dados, usuarioId) {
    const oportunidade = await Oportunidade.findOne({
      where: { id: oportunidadeId, cliente_id: clienteId },
    });
    if (!oportunidade) return null;

    for (const [campo, valorNovo] of Object.entries(dados)) {
      const valorAnterior = oportunidade[campo];
      if (valorAnterior !== valorNovo) {
        await OportunidadeService._registrarHistorico(
          oportunidadeId, usuarioId, 'atualizada',
          campo, String(valorAnterior ?? ''), String(valorNovo ?? '')
        );
      }
    }

    await oportunidade.update(dados);
    return oportunidade;
  }

  static async moverParaEstagio(oportunidadeId, clienteId, novoEstagioId, usuarioId, novaPosicao = 0) {
    const oportunidade = await Oportunidade.findOne({
      where: { id: oportunidadeId, cliente_id: clienteId },
    });
    if (!oportunidade) return null;

    const estagio = await EstagioPipeline.findOne({
      where: { id: novoEstagioId, cliente_id: clienteId },
    });
    if (!estagio) return null;

    const estagioAnterior = oportunidade.estagio_id;
    await oportunidade.update({ estagio_id: novoEstagioId, posicao_coluna: novaPosicao });
    await OportunidadeService._registrarHistorico(
      oportunidadeId, usuarioId, 'movida',
      'estagio_id', String(estagioAnterior), String(novoEstagioId)
    );
    return oportunidade;
  }

  static async fecharGanha(oportunidadeId, clienteId, usuarioId) {
    return OportunidadeService.atualizar(
      oportunidadeId, clienteId,
      { status: 'ganha', data_fechamento_real: new Date() },
      usuarioId
    );
  }

  static async fecharPerdida(oportunidadeId, clienteId, motivoPerda, usuarioId) {
    return OportunidadeService.atualizar(
      oportunidadeId, clienteId,
      { status: 'perdida', motivo_perda: motivoPerda || null },
      usuarioId
    );
  }

  static async metricas(clienteId) {
    const [total, ganhas, perdidas, abertas] = await Promise.all([
      Oportunidade.count({ where: { cliente_id: clienteId } }),
      Oportunidade.count({ where: { cliente_id: clienteId, status: 'ganha' } }),
      Oportunidade.count({ where: { cliente_id: clienteId, status: 'perdida' } }),
      Oportunidade.findAll({
        where: { cliente_id: clienteId, status: ['aberta', 'em_andamento'] },
        attributes: ['valor', 'probabilidade'],
        raw: true,
      }),
    ]);

    const valorEsperado = abertas.reduce(
      (acc, o) => acc + parseFloat(o.valor || 0) * (o.probabilidade / 100),
      0
    );

    return {
      total,
      ganhas,
      perdidas,
      taxaGanho: total > 0 ? Number(((ganhas / total) * 100).toFixed(1)) : 0,
      valorEsperado: Number(valorEsperado.toFixed(2)),
    };
  }

  static async deletar(oportunidadeId, clienteId) {
    return Oportunidade.destroy({ where: { id: oportunidadeId, cliente_id: clienteId } });
  }

  static async _registrarHistorico(oportunidadeId, usuarioId, acao, campo = null, valorAnterior = null, valorNovo = null) {
    return HistoricoOportunidade.create({
      oportunidade_id: oportunidadeId,
      usuario_id: usuarioId,
      acao,
      campo_alterado: campo,
      valor_anterior: valorAnterior,
      valor_novo: valorNovo,
    });
  }
}

module.exports = OportunidadeService;
