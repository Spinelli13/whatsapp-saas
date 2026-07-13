'use strict';

class SocketService {
  static emitirNovaFila(io, clienteId, departamentoId, filaCount) {
    io.of(`/cliente-${clienteId}`).emit('fila_atualizada', {
      departamento_id: departamentoId,
      fila_count: filaCount,
      timestamp: new Date(),
    });
  }

  static emitirAtendentesOnline(io, clienteId, atendentes) {
    io.of(`/cliente-${clienteId}`).emit('atendentes_online', {
      atendentes,
      timestamp: new Date(),
    });
  }

  static emitirMensagem(io, clienteId, mensagem) {
    io.of(`/cliente-${clienteId}`).emit('mensagem_nova', {
      ...mensagem,
      timestamp: new Date(),
    });
  }

  static emitirSatisfacao(io, clienteId, ticketId, rating) {
    io.of(`/cliente-${clienteId}`).emit('satisfacao_adicionada', {
      ticket_id: ticketId,
      rating,
      timestamp: new Date(),
    });
  }
}

module.exports = SocketService;
