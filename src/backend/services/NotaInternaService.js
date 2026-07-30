'use strict';

const { NotaInterna, Usuario } = require('../models');

class NotaInternaService {
  static async listar(atendimentoId) {
    return NotaInterna.findAll({
      where: { atendimento_id: atendimentoId },
      include: [
        {
          model: Usuario,
          as: 'autor',
          attributes: ['id', 'nome', 'email'],
        },
      ],
      order: [['criado_em', 'ASC']],
    });
  }

  static async criar(atendimentoId, usuarioId, { conteudo }) {
    if (!conteudo?.trim()) {
      const err = new Error('Conteúdo da nota é obrigatório');
      err.status = 400;
      throw err;
    }

    return NotaInterna.create({
      atendimento_id: atendimentoId,
      usuario_id: usuarioId,
      conteudo: conteudo.trim(),
    });
  }

  static async obter(id) {
    const nota = await NotaInterna.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'autor',
          attributes: ['id', 'nome', 'email'],
        },
      ],
    });
    if (!nota) {
      const err = new Error('Nota não encontrada');
      err.status = 404;
      throw err;
    }
    return nota;
  }

  static async deletar(id, usuarioId) {
    const nota = await this.obter(id);

    if (nota.usuario_id !== usuarioId) {
      const err = new Error('Apenas o criador pode deletar a nota');
      err.status = 403;
      throw err;
    }

    await nota.destroy();
    return { sucesso: true };
  }
}

module.exports = NotaInternaService;
