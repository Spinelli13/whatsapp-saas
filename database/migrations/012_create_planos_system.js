'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── 1. planos (global) ─────────────────────────────────────────────────
    await queryInterface.createTable('planos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      preco_mensal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      usuarios_limite: { type: Sequelize.INTEGER, allowNull: false },
      mensagens_limite: { type: Sequelize.INTEGER, allowNull: false },
      departamentos_limite: { type: Sequelize.INTEGER, allowNull: false },
      features: { type: Sequelize.JSONB, defaultValue: [] },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.addIndex('planos', ['nome'], { unique: true });

    // ── 2. cliente_plano (M2O: cliente → plano) ────────────────────────────
    await queryInterface.createTable('cliente_plano', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      plano_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'planos', key: 'id' },
        onDelete: 'CASCADE',
      },
      data_inicio: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      data_proxima_renovacao: { type: Sequelize.DATE, allowNull: true },
      status: {
        type: Sequelize.ENUM('ativo', 'cancelado', 'suspenso'),
        defaultValue: 'ativo',
      },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.addIndex('cliente_plano', ['cliente_id', 'status']);
    await queryInterface.addIndex('cliente_plano', ['cliente_id', 'plano_id'], { unique: true });

    // ── 3. uso_cliente (rastreamento mensal) ───────────────────────────────
    await queryInterface.createTable('uso_cliente', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      mes_ano: { type: Sequelize.STRING(7), allowNull: false },
      mensagens_usadas: { type: Sequelize.INTEGER, defaultValue: 0 },
      usuarios_criados: { type: Sequelize.INTEGER, defaultValue: 0 },
      departamentos_criados: { type: Sequelize.INTEGER, defaultValue: 0 },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.addIndex('uso_cliente', ['cliente_id', 'mes_ano']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('uso_cliente');
    await queryInterface.dropTable('cliente_plano');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_cliente_plano_status"`);
    await queryInterface.dropTable('planos');
  },
};
