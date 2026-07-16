'use strict';

const { ExportacaoDados, Usuario, FilaMensagem } = require('../models');
const { Op } = require('sequelize');

class DataExportService {
  static async solicitarExportacao(usuarioId, clienteId) {
    const existente = await ExportacaoDados.findOne({
      where: {
        usuario_id: usuarioId,
        cliente_id: clienteId,
        status: { [Op.in]: ['pendente', 'processando'] },
      },
    });

    if (existente) {
      throw new Error('Já existe exportação em andamento');
    }

    return ExportacaoDados.create({ usuario_id: usuarioId, cliente_id: clienteId, status: 'pendente' });
  }

  static async processarExportacao(exportacaoId) {
    const exportacao = await ExportacaoDados.findByPk(exportacaoId);
    if (!exportacao) throw new Error('Exportação não encontrada');

    exportacao.status = 'processando';
    await exportacao.save();

    try {
      const usuario = await Usuario.findByPk(exportacao.usuario_id, {
        attributes: ['id', 'nome', 'email', 'role', 'status'],
      });
      const mensagens = await FilaMensagem.findAll({
        where: { cliente_id: exportacao.cliente_id },
        attributes: ['id', 'telefone', 'texto', 'status', 'criado_em'],
      });

      const dados = {
        usuario: usuario?.toJSON() ?? null,
        mensagens: mensagens.map((m) => m.toJSON()),
        exportado_em: new Date(),
      };

      const json = JSON.stringify(dados, null, 2);

      exportacao.status = 'pronto';
      exportacao.tamanho_mb = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2);
      await exportacao.save();

      return exportacao;
    } catch (error) {
      exportacao.status = 'erro';
      await exportacao.save();
      throw error;
    }
  }

  static async solicitarDelecao(usuarioId, clienteId) {
    const usuario = await Usuario.findOne({ where: { id: usuarioId, cliente_id: clienteId } });
    if (!usuario) throw new Error('Usuário não encontrado');

    return {
      status: 'solicitacao_recebida',
      usuario_id: usuarioId,
      data_solicitacao: new Date(),
      nota: 'A deletação será processada em até 30 dias conforme LGPD Art. 18',
    };
  }

  static async listarExportacoes(usuarioId, clienteId) {
    return ExportacaoDados.findAll({
      where: { usuario_id: usuarioId, cliente_id: clienteId },
      order: [['criado_em', 'DESC']],
    });
  }
}

module.exports = DataExportService;
