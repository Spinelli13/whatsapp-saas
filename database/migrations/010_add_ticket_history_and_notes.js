'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ── Colunas extras em fila_mensagens ────────────────────────────────────

    await queryInterface.addColumn('fila_mensagens', 'ticket_status', {
      type: Sequelize.ENUM('novo', 'respondendo', 'resolvido', 'fechado', 'reaberto'),
      allowNull: false,
      defaultValue: 'novo',
    });

    await queryInterface.addColumn('fila_mensagens', 'satisfaction_rating', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('fila_mensagens', 'respondido_por', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'usuarios', key: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('fila_mensagens', 'respondido_em', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('fila_mensagens', ['respondido_em'], {
      name: 'idx_fila_mensagens_respondido_em',
    });

    // ── Tabela nota_tickets ─────────────────────────────────────────────────

    await queryInterface.createTable('nota_tickets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      ticket_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'fila_mensagens', key: 'id' },
        onDelete: 'CASCADE',
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'SET NULL',
      },
      conteudo: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      privada: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('now()'),
      },
      atualizado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('now()'),
      },
    });

    await queryInterface.addIndex('nota_tickets', ['ticket_id', 'criado_em'], {
      name: 'idx_nota_tickets_ticket_criado',
    });

    // ── Tabela historico_tickets ────────────────────────────────────────────

    await queryInterface.createTable('historico_tickets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      ticket_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'fila_mensagens', key: 'id' },
        onDelete: 'CASCADE',
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'SET NULL',
      },
      acao: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      dados_anteriores: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      dados_novos: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('now()'),
      },
    });

    await queryInterface.addIndex('historico_tickets', ['ticket_id', 'criado_em'], {
      name: 'idx_historico_tickets_ticket_criado',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('historico_tickets');
    await queryInterface.dropTable('nota_tickets');
    await queryInterface.removeIndex('fila_mensagens', 'idx_fila_mensagens_respondido_em');
    await queryInterface.removeColumn('fila_mensagens', 'respondido_em');
    await queryInterface.removeColumn('fila_mensagens', 'respondido_por');
    await queryInterface.removeColumn('fila_mensagens', 'satisfaction_rating');
    await queryInterface.removeColumn('fila_mensagens', 'ticket_status');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_fila_mensagens_ticket_status"'
    );
  },
};
