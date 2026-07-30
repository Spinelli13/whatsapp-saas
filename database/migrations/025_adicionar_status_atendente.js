'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('usuarios');
    if (!tableDesc.status_atendente) {
      await queryInterface.addColumn('usuarios', 'status_atendente', {
        type: Sequelize.ENUM('online', 'ausente', 'offline'),
        defaultValue: 'offline',
        allowNull: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'status_atendente');
    // Remove o tipo ENUM criado pelo Sequelize no PostgreSQL
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_usuarios_status_atendente";'
    );
  },
};
