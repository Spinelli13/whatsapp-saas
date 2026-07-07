const { Departamento } = require('../models');

async function listarDepartamentos(clienteId) {
  return Departamento.findAll({
    where: { cliente_id: clienteId, ativo: true },
    order: [['id', 'ASC']],
  });
}

async function validarDepartamento(clienteId, deptoId) {
  return Departamento.findOne({
    where: { id: deptoId, cliente_id: clienteId, ativo: true },
  });
}

async function departamentoPorIndice(clienteId, indice) {
  const lista = await listarDepartamentos(clienteId);
  const idx = parseInt(indice, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= lista.length) return null;
  return lista[idx];
}

module.exports = { listarDepartamentos, validarDepartamento, departamentoPorIndice };
