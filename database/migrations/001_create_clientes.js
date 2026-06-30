'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clientes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nome: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      plano: {
        type: Sequelize.ENUM('basico', 'profissional', 'enterprise'),
        allowNull: false,
        defaultValue: 'basico',
      },
      status: {
        type: Sequelize.ENUM('ativo', 'inativo', 'suspenso'),
        allowNull: false,
        defaultValue: 'ativo',
      },
      data_criacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      data_atualizacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clientes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_clientes_plano";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_clientes_status";');
  },
};
