'use strict';

/**
 * Migration: Add status to planos
 *
 * MasterController.deletarPlano soft-deletes by setting status='inativo',
 * matching the same convention already used on clientes/usuarios.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('planos', 'status', {
      type: Sequelize.ENUM('ativo', 'inativo'),
      allowNull: false,
      defaultValue: 'ativo',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('planos', 'status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_planos_status";');
  },
};
