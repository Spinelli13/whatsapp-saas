const { Op } = require('sequelize');
const { FilaMensagem } = require('../models');
const departamentoService = require('./departamentoService');

// Estado em memória apenas para a fase transitória "menu enviado, aguardando escolha".
// Se o servidor reiniciar, o pior caso é o usuário receber o menu novamente.
// TODO: Persistir em tabela 'conversas' caso necessário em versões futuras.
const _estados = {};

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
  });

  const posicao = await FilaMensagem.count({
    where: { cliente_id: clienteId, departamento_id: departamentoId, status: 'aguardando' },
  });

  return { entrada, posicao };
}

// ── API pública ───────────────────────────────────────────────

async function receberMensagem(clienteId, telefone, texto) {
  // Verifica se já existe entrada ativa no banco
  const ativa = await FilaMensagem.findOne({
    where: {
      cliente_id: clienteId,
      telefone,
      status: { [Op.in]: ['aguardando', 'atribuido'] },
    },
    order: [['created_at', 'DESC']],
  });

  const mem = _getEstado(clienteId, telefone);

  // Nenhuma entrada ativa e nenhum menu pendente → enviar menu
  if (!ativa && (!mem || mem.estado === 'fechado')) {
    _setEstado(clienteId, telefone, 'menu_enviado');
    return { acao: 'menu', resposta: await _montarMenu(clienteId) };
  }

  // Menu foi enviado, processando escolha
  if (!ativa && mem?.estado === 'menu_enviado') {
    const depto = await departamentoService.departamentoPorIndice(clienteId, (texto || '').trim());

    if (!depto) {
      const total = (await departamentoService.listarDepartamentos(clienteId)).length;
      const menu = await _montarMenu(clienteId);
      return {
        acao: 'opcao_invalida',
        resposta: `Opção inválida. Digite um número de 1 a ${total}.\n\n${menu}`,
      };
    }

    const { posicao } = await _enfileirar(clienteId, depto.id, telefone, texto);
    _setEstado(clienteId, telefone, 'na_fila', depto.id);

    return {
      acao: 'enfileirado',
      departamento: { id: depto.id, nome: depto.nome, emoji: depto.emoji },
      posicao,
      resposta: `✅ Você entrou na fila de *${depto.nome}*.\nSua posição: *${posicao}º*\n\nAguarde, um atendente irá te chamar em breve. 🙏`,
    };
  }

  // Já na fila (aguardando)
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

  // Atribuído a atendente → não auto-responder
  if (ativa?.status === 'atribuido') {
    return { acao: 'encaminhar_atendente', departamento_id: ativa.departamento_id, resposta: null };
  }

  // Fallback
  _setEstado(clienteId, telefone, 'menu_enviado');
  return { acao: 'menu', resposta: await _montarMenu(clienteId) };
}

async function enfileirar(clienteId, departamentoId, telefone, texto) {
  const { posicao } = await _enfileirar(clienteId, departamentoId, telefone, texto);
  _setEstado(clienteId, telefone, 'na_fila', departamentoId);
  return posicao;
}

async function obterFila(clienteId, departamentoId = null) {
  const where = { cliente_id: clienteId };
  if (departamentoId) where.departamento_id = departamentoId;

  const registros = await FilaMensagem.findAll({
    where,
    order: [['created_at', 'ASC']],
  });

  if (departamentoId) return registros;

  // Agrupa por departamento_id quando não há filtro
  return registros.reduce((acc, r) => {
    const key = r.departamento_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
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

module.exports = {
  receberMensagem,
  enfileirar,
  obterFila,
  atribuirAtendente,
  fecharConversa,
  obterEstado,
  statusGeral,
};
