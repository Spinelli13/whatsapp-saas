'use strict';

/**
 * Migration: Allow usuarios.cliente_id to be NULL
 *
 * The master user (role='master') is the owner of the system and does not
 * belong to any client, so cliente_id must be optional for that row.
 * All other roles (admin, atendente) still expect cliente_id to be set at
 * the application level.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('usuarios', 'cliente_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'clientes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('usuarios', 'cliente_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },
};
