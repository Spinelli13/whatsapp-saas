'use strict';

const { RespostaRapida } = require('../models');
const { Op } = require('sequelize');

class RespostaRapidaService {
  static async listar(clienteId) {
    return RespostaRapida.findAll({
      where: { cliente_id: clienteId, ativo: true },
      order: [['titulo', 'ASC']],
      attributes: ['id', 'titulo', 'conteudo', 'atalho', 'criado_em'],
    });
  }

  static async obter(clienteId, id) {
    const resposta = await RespostaRapida.findOne({ where: { id, cliente_id: clienteId } });
    if (!resposta) {
      const err = new Error('Resposta rápida não encontrada');
      err.status = 404;
      throw err;
    }
    return resposta;
  }

  static async criar(clienteId, { titulo, conteudo, atalho }) {
    if (atalho) {
      const existe = await RespostaRapida.findOne({ where: { cliente_id: clienteId, atalho } });
      if (existe) {
        const err = new Error('Atalho já existe para este cliente');
        err.status = 409;
        throw err;
      }
    }

    return RespostaRapida.create({
      cliente_id: clienteId,
      titulo,
      conteudo,
      atalho: atalho || null,
    });
  }

  static async atualizar(clienteId, id, { titulo, conteudo, atalho, ativo }) {
    const resposta = await this.obter(clienteId, id);

    if (atalho && atalho !== resposta.atalho) {
      const existe = await RespostaRapida.findOne({
        where: { cliente_id: clienteId, atalho, id: { [Op.ne]: id } },
      });
      if (existe) {
        const err = new Error('Atalho já existe para este cliente');
        err.status = 409;
        throw err;
      }
    }

    return resposta.update({
      ...(titulo     !== undefined && { titulo }),
      ...(conteudo   !== undefined && { conteudo }),
      ...(atalho     !== undefined && { atalho: atalho || null }),
      ...(ativo      !== undefined && { ativo }),
    });
  }

  static async deletar(clienteId, id) {
    const resposta = await this.obter(clienteId, id);
    await resposta.destroy();
    return { sucesso: true };
  }

  static substituirVariaveis(conteudo, variaveis = {}) {
    let resultado = conteudo;
    for (const [chave, valor] of Object.entries(variaveis)) {
      resultado = resultado.replace(new RegExp(`\\{\\{${chave}\\}\\}`, 'g'), valor ?? '');
    }
    return resultado;
  }
}

module.exports = RespostaRapidaService;
