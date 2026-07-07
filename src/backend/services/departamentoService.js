const { NODE_ENV } = require('../config/environment');

// TODO FASE 2.3: Substituir _MOCK_DEPARTAMENTOS por query ao banco:
//   SELECT * FROM departamentos WHERE cliente_id = :clienteId AND ativo = true ORDER BY ordem
// Ao migrar: deletar _MOCK_DEPARTAMENTOS e _MOCK_POR_CLIENTE, manter assinaturas das funções.

const _MOCK_DEPARTAMENTOS = [
  { id: 'vendas',     nome: 'Vendas',     emoji: '🛒', ordem: 1 },
  { id: 'suporte',    nome: 'Suporte',    emoji: '🔧', ordem: 2 },
  { id: 'financeiro', nome: 'Financeiro', emoji: '💰', ordem: 3 },
  { id: 'rh',         nome: 'RH',         emoji: '👥', ordem: 4 },
];

// Permite overrides por cliente (será tabela no BD)
const _MOCK_POR_CLIENTE = {
  // cliente 1 e 2 usam lista padrão — adicionar overrides aqui se necessário
};

function listarDepartamentos(clienteId) {
  // TODO FASE 2.3: return await Departamento.findAll({ where: { cliente_id: clienteId, ativo: true } });
  return _MOCK_POR_CLIENTE[clienteId] || _MOCK_DEPARTAMENTOS;
}

function validarDepartamento(clienteId, deptoId) {
  return listarDepartamentos(clienteId).find((d) => d.id === deptoId) || null;
}

function departamentoPorIndice(clienteId, indice) {
  const lista = listarDepartamentos(clienteId);
  const idx = parseInt(indice, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= lista.length) return null;
  return lista[idx];
}

module.exports = { listarDepartamentos, validarDepartamento, departamentoPorIndice };
