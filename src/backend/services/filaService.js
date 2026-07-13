'use strict';

const { Op } = require('sequelize');
const { FilaMensagem, NotaTicket, HistoricoTicket } = require('../models');
const departamentoService = require('./departamentoService');

// ── Estados transitórios (apenas fase "menu enviado, aguardando escolha") ──
// Restart do servidor → usuário recebe o menu novamente (comportamento aceitável).
const _estados = {};

const TICKET_STATUS = ['novo', 'respondendo', 'resolvido', 'fechado', 'reaberto'];

function _chave(clienteId, telefone) {
  return `${clienteId}:${telefone}`;
}

function _getEstado(clienteId, telefone) {
  return _estados[_chave(clienteId, telefone)] || null;
}

function _setEstado(clienteId, telefone, estado, departamento_id = null) {
  _estados[_chave(clienteId, telefone)] = { estado, departamento_id, em: new Date().toISOString() };
}

async function _montarMenu(clienteId) {
  const depts = await departamentoService.listarDepartamentos(clienteId);
  const linhas = depts.map((d, i) => `${i + 1}. ${d.emoji || ''} ${d.nome}`.trim());
  return `Olá! Como podemos ajudar?\n\n${linhas.join('\n')}\n\nDigite o número da opção desejada.`;
}

async function _enfileirar(clienteId, departamentoId, telefone, texto) {
  const entrada = await FilaMensagem.create({
    cliente_id: clienteId,
    departamento_id: departamentoId,
    telefone,
    texto,
    status: 'aguardando',
    ticket_status: 'novo',
  });

  await HistoricoTicket.create({
    ticket_id: entrada.id,
    usuario_id: null,
    acao: 'criado',
    dados_anteriores: null,
    dados_novos: { cliente_id: clienteId, departamento_id: departamentoId, telefone },
  });

  const posicao = await FilaMensagem.count({
    where: { cliente_id: clienteId, departamento_id: departamentoId, status: 'aguardando' },
  });

  return { entrada, posicao };
}

// ── API pública — fila ────────────────────────────────────────────────────

async function receberMensagem(clienteId, telefone, texto) {
  const ativa = await FilaMensagem.findOne({
    where: {
      cliente_id: clienteId,
      telefone,
      status: { [Op.in]: ['aguardando', 'atribuido'] },
    },
    order: [['created_at', 'DESC']],
  });

  const mem = _getEstado(clienteId, telefone);

  if (!ativa && (!mem || mem.estado === 'fechado')) {
    _setEstado(clienteId, telefone, 'menu_enviado');
    return { acao: 'menu_enviado', menu: await _montarMenu(clienteId) };
  }

  if (!ativa && mem?.estado === 'menu_enviado') {
    const depto = await departamentoService.departamentoPorIndice(clienteId, (texto || '').trim());

    if (!depto) {
      const total = (await departamentoService.listarDepartamentos(clienteId)).length;
      const menu = await _montarMenu(clienteId);
      return {
        acao: 'menu_reenviado',
        menu: `Opção inválida. Digite um número de 1 a ${total}.\n\n${menu}`,
      };
    }

    const { entrada, posicao } = await _enfileirar(clienteId, depto.id, telefone, texto);
    _setEstado(clienteId, telefone, 'na_fila', depto.id);

    return {
      acao: 'na_fila',
      ticket_id: entrada.id,
      departamento: { id: depto.id, nome: depto.nome, emoji: depto.emoji },
      posicao,
      resposta: `✅ Você entrou na fila de *${depto.nome}*.\nSua posição: *${posicao}º*\n\nAguarde, um atendente irá te chamar em breve. 🙏`,
    };
  }

  if (ativa?.status === 'aguardando') {
    const posicao = await FilaMensagem.count({
      where: {
        cliente_id: clienteId,
        departamento_id: ativa.departamento_id,
        status: 'aguardando',
        created_at: { [Op.lte]: ativa.created_at },
      },
    });
    return {
      acao: 'ja_na_fila',
      resposta: `Você já está na fila. Posição: *${posicao}º*\n\nAguarde um atendente. 😊`,
    };
  }

  if (ativa?.status === 'atribuido') {
    return { acao: 'encaminhar_atendente', departamento_id: ativa.departamento_id, resposta: null };
  }

  _setEstado(clienteId, telefone, 'menu_enviado');
  return { acao: 'menu_enviado', menu: await _montarMenu(clienteId) };
}

async function enfileirar(clienteId, departamentoId, telefone, texto) {
  const { posicao } = await _enfileirar(clienteId, departamentoId, telefone, texto);
  _setEstado(clienteId, telefone, 'na_fila', departamentoId);
  return posicao;
}

async function obterFila(clienteId, departamentoId = null) {
  const where = { cliente_id: clienteId };
  if (departamentoId) where.departamento_id = departamentoId;

  return FilaMensagem.findAll({
    where,
    order: [['created_at', 'ASC']],
  });
}

async function atribuirAtendente(clienteId, departamentoId, mensagemId, atendenteId) {
  const entrada = await FilaMensagem.findOne({
    where: { id: mensagemId, cliente_id: clienteId, departamento_id: departamentoId },
  });

  if (!entrada) {
    const err = new Error('Entrada não encontrada na fila');
    err.status = 404;
    throw err;
  }

  await entrada.update({ status: 'atribuido', atendente_id: atendenteId });
  _setEstado(clienteId, entrada.telefone, 'atribuido', departamentoId);

  return entrada;
}

async function fecharConversa(clienteId, departamentoId, mensagemId) {
  const entrada = await FilaMensagem.findOne({
    where: { id: mensagemId, cliente_id: clienteId, departamento_id: departamentoId },
  });

  if (!entrada) {
    const err = new Error('Entrada não encontrada na fila');
    err.status = 404;
    throw err;
  }

  await entrada.update({ status: 'fechado' });
  _setEstado(clienteId, entrada.telefone, 'fechado', departamentoId);

  return entrada;
}

function obterEstado(clienteId, telefone) {
  return _getEstado(clienteId, telefone);
}

async function statusGeral(clienteId) {
  const registros = await FilaMensagem.findAll({
    where: { cliente_id: clienteId },
    attributes: ['departamento_id', 'status'],
    raw: true,
  });

  return registros.reduce((acc, r) => {
    if (!acc[r.departamento_id]) {
      acc[r.departamento_id] = { total: 0, aguardando: 0, atribuido: 0, fechado: 0 };
    }
    acc[r.departamento_id].total++;
    acc[r.departamento_id][r.status]++;
    return acc;
  }, {});
}

// ── API pública — ticket lifecycle ───────────────────────────────────────

async function obterHistoricoCompleto(ticketId, usuarioClienteId) {
  const ticket = await FilaMensagem.findOne({ where: { id: ticketId } });

  if (!ticket) {
    const err = new Error('Ticket não encontrado');
    err.status = 404;
    throw err;
  }

  if (ticket.cliente_id !== usuarioClienteId) {
    const err = new Error('Acesso negado');
    err.status = 403;
    throw err;
  }

  const [notas, historico] = await Promise.all([
    NotaTicket.findAll({
      where: { ticket_id: ticketId },
      order: [['criado_em', 'ASC']],
    }),
    HistoricoTicket.findAll({
      where: { ticket_id: ticketId },
      order: [['criado_em', 'ASC']],
    }),
  ]);

  return { ticket, notas, historico };
}

async function adicionarNota(ticketId, usuarioId, usuarioClienteId, conteudo, privada = false) {
  const ticket = await FilaMensagem.findOne({ where: { id: ticketId } });

  if (!ticket) {
    const err = new Error('Ticket não encontrado');
    err.status = 404;
    throw err;
  }

  if (ticket.cliente_id !== usuarioClienteId) {
    const err = new Error('Acesso negado');
    err.status = 403;
    throw err;
  }

  const nota = await NotaTicket.create({
    ticket_id: ticketId,
    usuario_id: usuarioId,
    conteudo: conteudo.trim(),
    privada: Boolean(privada),
  });

  await HistoricoTicket.create({
    ticket_id: ticketId,
    usuario_id: usuarioId,
    acao: 'nota_adicionada',
    dados_novos: { nota_id: nota.id, privada: Boolean(privada) },
  });

  return nota;
}

async function mudarStatus(ticketId, novoStatus, usuarioId, usuarioClienteId) {
  if (!TICKET_STATUS.includes(novoStatus)) {
    const err = new Error(`Status inválido. Valores aceitos: ${TICKET_STATUS.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const ticket = await FilaMensagem.findOne({ where: { id: ticketId } });

  if (!ticket) {
    const err = new Error('Ticket não encontrado');
    err.status = 404;
    throw err;
  }

  if (ticket.cliente_id !== usuarioClienteId) {
    const err = new Error('Acesso negado');
    err.status = 403;
    throw err;
  }

  const statusAnterior = ticket.ticket_status;
  const atualizacoes = { ticket_status: novoStatus };

  if (novoStatus === 'respondendo') {
    atualizacoes.respondido_por = usuarioId;
    atualizacoes.respondido_em = new Date();
  }

  await ticket.update(atualizacoes);

  await HistoricoTicket.create({
    ticket_id: ticketId,
    usuario_id: usuarioId,
    acao: 'status_alterado',
    dados_anteriores: { ticket_status: statusAnterior },
    dados_novos: { ticket_status: novoStatus },
  });

  return ticket;
}

async function adicionarSatisfacao(ticketId, rating, usuarioClienteId) {
  const ticket = await FilaMensagem.findOne({ where: { id: ticketId } });

  if (!ticket) {
    const err = new Error('Ticket não encontrado');
    err.status = 404;
    throw err;
  }

  if (ticket.cliente_id !== usuarioClienteId) {
    const err = new Error('Acesso negado');
    err.status = 403;
    throw err;
  }

  await ticket.update({ satisfaction_rating: rating });

  await HistoricoTicket.create({
    ticket_id: ticketId,
    usuario_id: null,
    acao: 'rating_adicionado',
    dados_novos: { rating },
  });

  return ticket;
}

module.exports = {
  receberMensagem,
  enfileirar,
  obterFila,
  atribuirAtendente,
  fecharConversa,
  obterEstado,
  statusGeral,
  obterHistoricoCompleto,
  adicionarNota,
  mudarStatus,
  adicionarSatisfacao,
  TICKET_STATUS,
};
