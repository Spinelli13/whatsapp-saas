'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Requer PostgreSQL 13+ para gen_random_uuid()
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    await queryInterface.createTable('fila_mensagens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
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
        allowNull: false,
        references: { model: 'departamentos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      telefone: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      texto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('aguardando', 'atribuido', 'fechado'),
        allowNull: false,
        defaultValue: 'aguardando',
      },
      atendente_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      posicao_fila: {
        type: Sequelize.INTEGER,
        allowNull: true,
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

    await queryInterface.addIndex('fila_mensagens', ['cliente_id', 'departamento_id', 'status'], {
      name: 'fila_cliente_dept_status_idx',
    });
    await queryInterface.addIndex('fila_mensagens', ['cliente_id', 'telefone', 'status'], {
      name: 'fila_cliente_telefone_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('fila_mensagens');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_fila_mensagens_status";');
  },
};
