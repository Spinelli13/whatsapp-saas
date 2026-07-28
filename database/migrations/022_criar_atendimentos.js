'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── Tabela de atendimentos ─────────────────────────────────────────────────
    await queryInterface.createTable('atendimentos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      numero_whatsapp: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      nome_cliente: {
        type: Sequelize.STRING(150),
      },
      status: {
        type: Sequelize.ENUM('pendente', 'ativo', 'encerrado'),
        defaultValue: 'pendente',
      },
      prioridade: {
        type: Sequelize.ENUM('baixa', 'media', 'alta'),
        defaultValue: 'media',
      },
      setor: {
        type: Sequelize.STRING(100),
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'SET NULL',
      },
      feedback_score: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      dados_cliente: {
        type: Sequelize.JSONB,
      },
      ultima_mensagem: {
        type: Sequelize.TEXT,
      },
      criado_em: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      atualizado_em: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // ── Tabela de fila de mensagens ────────────────────────────────────────────
    await queryInterface.createTable('message_queue', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      atendimento_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'atendimentos', key: 'id' },
        onDelete: 'CASCADE',
      },
      tipo: {
        type: Sequelize.ENUM('entrada', 'saida'),
        allowNull: false,
      },
      mensagem: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      lido: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      criado_em: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      atualizado_em: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // ── Índices ────────────────────────────────────────────────────────────────
    await queryInterface.addIndex('atendimentos', ['cliente_id'], { name: 'idx_atendimentos_cliente_id' });
    await queryInterface.addIndex('atendimentos', ['status'],     { name: 'idx_atendimentos_status' });
    await queryInterface.addIndex('atendimentos', ['cliente_id', 'numero_whatsapp'], { name: 'idx_atendimentos_cliente_numero' });
    await queryInterface.addIndex('message_queue', ['atendimento_id'], { name: 'idx_message_queue_atendimento_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('message_queue');
    await queryInterface.dropTable('atendimentos');
  },
};
