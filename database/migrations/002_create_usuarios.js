'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      senha: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      nome: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('admin', 'atendente'),
        allowNull: false,
        defaultValue: 'atendente',
      },
      status: {
        type: Sequelize.ENUM('ativo', 'inativo'),
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

    await queryInterface.addIndex('usuarios', ['cliente_id'], {
      name: 'usuarios_cliente_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('usuarios');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_usuarios_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_usuarios_status";');
  },
};
