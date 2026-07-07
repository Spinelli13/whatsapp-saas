const { randomUUID } = require('crypto');
const departamentoService = require('./departamentoService');

// TODO FASE 2.3: Migrar estado em memória para PostgreSQL:
//   _filas    → tabela fila_mensagens (id, cliente_id, departamento_id, telefone, texto, status, atendente_id, created_at, updated_at)
//   _estados  → tabela conversas      (id, cliente_id, telefone, estado, departamento_id, updated_at)
// Ao migrar: substituir as funções _get/_set abaixo por queries Sequelize, manter assinaturas públicas.

// filas[clienteId][departamentoId] = [EntradaFila]
const _filas = {};

// _estados[`${clienteId}:${telefone}`] = { estado, departamento, atualizadoEm }
// estado: 'menu_enviado' | 'na_fila' | 'atribuido' | 'fechado'
const _estados = {};

// ── Helpers internos ──────────────────────────────────────────

function _filaCliente(clienteId) {
  if (!_filas[clienteId]) _filas[clienteId] = {};
  return _filas[clienteId];
}

function _chaveEstado(clienteId, telefone) {
  return `${clienteId}:${telefone}`;
}

function _getEstado(clienteId, telefone) {
  return _estados[_chaveEstado(clienteId, telefone)] || null;
}

function _setEstado(clienteId, telefone, estado, departamento = null) {
  _estados[_chaveEstado(clienteId, telefone)] = {
    estado,
    departamento,
    atualizadoEm: new Date().toISOString(),
  };
}

function _montarMenu(clienteId) {
  const depts = departamentoService.listarDepartamentos(clienteId);
  const linhas = depts.map((d, i) => `${i + 1}. ${d.emoji} ${d.nome}`);
  return `Olá! Como podemos ajudar?\n\n${linhas.join('\n')}\n\nDigite o número da opção desejada.`;
}

// ── Funções públicas ──────────────────────────────────────────

/**
 * Processa mensagem recebida do WhatsApp.
 * Retorna { acao, resposta, departamento?, posicao? }
 * resposta = null quando a mensagem deve ir ao atendente (não auto-responder)
 */
function receberMensagem(clienteId, telefone, texto) {
  const estado = _getEstado(clienteId, telefone);
  const textoLimpo = (texto || '').trim();

  if (!estado || estado.estado === 'fechado') {
    _setEstado(clienteId, telefone, 'menu_enviado');
    return { acao: 'menu', resposta: _montarMenu(clienteId) };
  }

  if (estado.estado === 'menu_enviado') {
    const depto = departamentoService.departamentoPorIndice(clienteId, textoLimpo);

    if (!depto) {
      const total = departamentoService.listarDepartamentos(clienteId).length;
      return {
        acao: 'opcao_invalida',
        resposta: `Opção inválida. Por favor, digite um número de 1 a ${total}.\n\n${_montarMenu(clienteId)}`,
      };
    }

    const posicao = _enfileirar(clienteId, depto.id, telefone, textoLimpo);
    _setEstado(clienteId, telefone, 'na_fila', depto.id);

    return {
      acao: 'enfileirado',
      departamento: depto,
      posicao,
      resposta: `✅ Você entrou na fila de *${depto.nome}*.\nSua posição: *${posicao}º*\n\nAguarde, um atendente irá te chamar em breve. 🙏`,
    };
  }

  if (estado.estado === 'na_fila') {
    const fila = _filaCliente(clienteId)[estado.departamento] || [];
    const posicao = fila.findIndex((m) => m.telefone === telefone && m.status === 'aguardando') + 1;
    return {
      acao: 'ja_na_fila',
      resposta: `Você já está na fila de *${estado.departamento}*. Posição: *${posicao || '?'}º*\n\nAguarde um atendente. 😊`,
    };
  }

  if (estado.estado === 'atribuido') {
    // Mensagem encaminhada ao atendente via Socket.io — sem auto-resposta
    return { acao: 'encaminhar_atendente', departamento: estado.departamento, resposta: null };
  }

  // Fallback inesperado → reinicia fluxo
  _setEstado(clienteId, telefone, 'menu_enviado');
  return { acao: 'menu', resposta: _montarMenu(clienteId) };
}

function _enfileirar(clienteId, departamentoId, telefone, texto) {
  const filaCliente = _filaCliente(clienteId);
  if (!filaCliente[departamentoId]) filaCliente[departamentoId] = [];

  filaCliente[departamentoId].push({
    id: randomUUID(),
    clienteId,
    telefone,
    departamento: departamentoId,
    texto,
    status: 'aguardando',
    timestamp: new Date().toISOString(),
    atendente_id: null,
  });

  return filaCliente[departamentoId].filter((m) => m.status === 'aguardando').length;
}

/** Enfileirar manualmente (chamado da rota POST /fila/escolher-departamento) */
function enfileirar(clienteId, departamentoId, telefone, texto) {
  const posicao = _enfileirar(clienteId, departamentoId, telefone, texto);
  _setEstado(clienteId, telefone, 'na_fila', departamentoId);
  return posicao;
}

/** Retorna fila de um departamento ou objeto completo {depto: []} do cliente */
function obterFila(clienteId, departamentoId = null) {
  const filaCliente = _filaCliente(clienteId);
  if (departamentoId) return filaCliente[departamentoId] || [];
  return filaCliente;
}

/** Atribui atendente a uma entrada da fila */
function atribuirAtendente(clienteId, departamentoId, mensagemId, atendenteId) {
  const fila = _filaCliente(clienteId)[departamentoId] || [];
  const entrada = fila.find((m) => m.id === mensagemId);

  if (!entrada) {
    const err = new Error('Entrada não encontrada na fila');
    err.status = 404;
    throw err;
  }

  entrada.status = 'atribuido';
  entrada.atendente_id = atendenteId;
  _setEstado(clienteId, entrada.telefone, 'atribuido', departamentoId);

  return entrada;
}

/** Fecha conversa e remove da fila ativa */
function fecharConversa(clienteId, departamentoId, mensagemId) {
  const fila = _filaCliente(clienteId)[departamentoId] || [];
  const entrada = fila.find((m) => m.id === mensagemId);

  if (!entrada) {
    const err = new Error('Entrada não encontrada na fila');
    err.status = 404;
    throw err;
  }

  entrada.status = 'fechado';
  _setEstado(clienteId, entrada.telefone, 'fechado', departamentoId);

  return entrada;
}

function obterEstado(clienteId, telefone) {
  return _getEstado(clienteId, telefone);
}

/** Resumo por departamento: total / aguardando / atribuido / fechado */
function statusGeral(clienteId) {
  const filaCliente = _filaCliente(clienteId);
  const resultado = {};
  for (const [dept, fila] of Object.entries(filaCliente)) {
    resultado[dept] = {
      total: fila.length,
      aguardando: fila.filter((m) => m.status === 'aguardando').length,
      atribuido:  fila.filter((m) => m.status === 'atribuido').length,
      fechado:    fila.filter((m) => m.status === 'fechado').length,
    };
  }
  return resultado;
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
