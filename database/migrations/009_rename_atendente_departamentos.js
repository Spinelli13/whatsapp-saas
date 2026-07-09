'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameTable('atendentes_departamentos', 'atendente_departamentos');
  },
  down: async (queryInterface) => {
    await queryInterface.renameTable('atendente_departamentos', 'atendentes_departamentos');
  },
};
