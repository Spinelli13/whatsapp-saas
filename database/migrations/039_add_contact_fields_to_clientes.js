'use strict';

/**
 * Migration: Add contact fields to clientes
 *
 * MasterController needs to register a client's own contact info
 * (email/cnpj/telefone) separately from any individual usuario's login
 * email. All three are nullable since existing client rows predate them.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('clientes', 'email', {
      type: Sequelize.STRING(150),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('clientes', 'cnpj', {
      type: Sequelize.STRING(20),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('clientes', 'telefone', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('clientes', 'telefone');
    await queryInterface.removeColumn('clientes', 'cnpj');
    await queryInterface.removeColumn('clientes', 'email');
  },
};
