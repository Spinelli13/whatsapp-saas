'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── 1. audit_log ──────────────────────────────────────────────────────────
    await queryInterface.createTable('audit_log', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'SET NULL',
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      tabela: { type: Sequelize.STRING(100), allowNull: false },
      acao: {
        type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE'),
        allowNull: false,
      },
      dados_antes: { type: Sequelize.JSONB, allowNull: true },
      dados_depois: { type: Sequelize.JSONB, allowNull: true },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.TEXT, allowNull: true },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.addIndex('audit_log', ['usuario_id', 'criado_em']);
    await queryInterface.addIndex('audit_log', ['cliente_id', 'criado_em']);
    await queryInterface.addIndex('audit_log', ['tabela']);

    // ── 2. data_retention_policy ──────────────────────────────────────────────
    await queryInterface.createTable('data_retention_policy', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      dias_retencao_historico: { type: Sequelize.INTEGER, defaultValue: 180 },
      dias_retencao_logs: { type: Sequelize.INTEGER, defaultValue: 90 },
      deletar_automaticamente: { type: Sequelize.BOOLEAN, defaultValue: true },
      atualizado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.addIndex('data_retention_policy', ['cliente_id']);

    // ── 3. exportacao_dados ───────────────────────────────────────────────────
    await queryInterface.createTable('exportacao_dados', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('pendente', 'processando', 'pronto', 'erro'),
        defaultValue: 'pendente',
      },
      arquivo_url: { type: Sequelize.STRING(500), allowNull: true },
      tamanho_mb: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      expira_em: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW() + INTERVAL '30 days'"),
      },
    });

    await queryInterface.addIndex('exportacao_dados', ['usuario_id', 'status']);
    await queryInterface.addIndex('exportacao_dados', ['cliente_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('exportacao_dados');
    await queryInterface.dropTable('data_retention_policy');
    await queryInterface.dropTable('audit_log');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_audit_log_acao");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_exportacao_dados_status");
  },
};
