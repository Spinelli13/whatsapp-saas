'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── 1. estagios_pipeline ──────────────────────────────────────────────────
    await queryInterface.createTable('estagios_pipeline', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      nome: { type: Sequelize.STRING, allowNull: false },
      descricao: { type: Sequelize.TEXT },
      cor: { type: Sequelize.STRING(20), defaultValue: '#3B82F6' },
      ordem: { type: Sequelize.INTEGER, defaultValue: 0 },
      ativo: { type: Sequelize.BOOLEAN, defaultValue: true },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      atualizado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('estagios_pipeline', ['cliente_id', 'ordem']);

    // ── 2. oportunidades ─────────────────────────────────────────────────────
    await queryInterface.createTable('oportunidades', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      titulo: { type: Sequelize.STRING, allowNull: false },
      descricao: { type: Sequelize.TEXT },
      valor: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      estagio_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'estagios_pipeline', key: 'id' },
        onDelete: 'SET NULL',
      },
      contato_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'SET NULL',
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'RESTRICT',
      },
      probabilidade: { type: Sequelize.INTEGER, defaultValue: 50 },
      data_fechamento_esperada: { type: Sequelize.DATE },
      data_fechamento_real: { type: Sequelize.DATE },
      status: {
        type: Sequelize.ENUM('aberta', 'ganha', 'perdida', 'em_andamento'),
        defaultValue: 'aberta',
      },
      motivo_perda: { type: Sequelize.TEXT },
      posicao_coluna: { type: Sequelize.INTEGER, defaultValue: 0 },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      atualizado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('oportunidades', ['cliente_id', 'estagio_id']);
    await queryInterface.addIndex('oportunidades', ['cliente_id', 'status']);

    // ── 3. historico_oportunidade ─────────────────────────────────────────────
    await queryInterface.createTable('historico_oportunidade', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      oportunidade_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'oportunidades', key: 'id' },
        onDelete: 'CASCADE',
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'RESTRICT',
      },
      acao: { type: Sequelize.STRING(100), allowNull: false },
      campo_alterado: { type: Sequelize.STRING(100) },
      valor_anterior: { type: Sequelize.TEXT },
      valor_novo: { type: Sequelize.TEXT },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('historico_oportunidade', ['oportunidade_id', 'criado_em']);

    // ── 4. configuracao_pipeline ──────────────────────────────────────────────
    await queryInterface.createTable('configuracao_pipeline', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      moeda: { type: Sequelize.STRING(10), defaultValue: 'BRL' },
      dias_ciclo_vendas_esperado: { type: Sequelize.INTEGER, defaultValue: 30 },
      mostrar_probabilidade: { type: Sequelize.BOOLEAN, defaultValue: true },
      mostrar_valor_esperado: { type: Sequelize.BOOLEAN, defaultValue: true },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      atualizado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('configuracao_pipeline');
    await queryInterface.dropTable('historico_oportunidade');
    await queryInterface.dropTable('oportunidades');
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_oportunidades_status");
    await queryInterface.dropTable('estagios_pipeline');
  },
};
