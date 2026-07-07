'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mensagens_automaticas', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      departamento_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'departamentos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      palavra_chave: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      resposta: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('ativo', 'inativo'),
        allowNull: false,
        defaultValue: 'ativo',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('mensagens_automaticas', ['cliente_id', 'status'], {
      name: 'msg_auto_cliente_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('mensagens_automaticas');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_mensagens_automaticas_status";');
  },
};
