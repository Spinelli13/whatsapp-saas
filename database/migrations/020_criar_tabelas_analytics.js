'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('metricas_vendas', {
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
      data: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      total_oportunidades: { type: Sequelize.INTEGER, defaultValue: 0 },
      oportunidades_ganhas: { type: Sequelize.INTEGER, defaultValue: 0 },
      oportunidades_perdidas: { type: Sequelize.INTEGER, defaultValue: 0 },
      valor_total: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      valor_ganho: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      valor_perdido: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      taxa_conversao: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
      ticket_medio: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0 },
      criado_em: Sequelize.DATE,
    });

    await queryInterface.addIndex('metricas_vendas', ['cliente_id', 'data'], {
      name: 'idx_metricas_vendas_cliente_data',
    });

    await queryInterface.createTable('analise_sentimento', {
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
      email_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'emails', key: 'id' },
        onDelete: 'SET NULL',
      },
      sms_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'sms', key: 'id' },
        onDelete: 'SET NULL',
      },
      texto: Sequelize.TEXT,
      sentimento: {
        type: Sequelize.ENUM('positivo', 'neutro', 'negativo'),
        defaultValue: 'neutro',
      },
      confianca: Sequelize.DECIMAL(5, 2),
      palavras_chave: Sequelize.JSON,
      criado_em: Sequelize.DATE,
    });

    await queryInterface.addIndex('analise_sentimento', ['cliente_id', 'sentimento'], {
      name: 'idx_analise_sentimento_cliente',
    });

    await queryInterface.createTable('previsoes_ia', {
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
      oportunidade_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'oportunidades', key: 'id' },
        onDelete: 'SET NULL',
      },
      tipo: {
        type: Sequelize.ENUM('probabilidade_ganho', 'tempo_fechamento', 'churn_risk'),
        defaultValue: 'probabilidade_ganho',
      },
      predicao: Sequelize.DECIMAL(5, 2),
      confianca: Sequelize.DECIMAL(5, 2),
      fatores: Sequelize.JSON,
      criado_em: Sequelize.DATE,
    });

    await queryInterface.createTable('recomendacoes_ia', {
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
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'SET NULL',
      },
      oportunidade_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'oportunidades', key: 'id' },
        onDelete: 'SET NULL',
      },
      tipo: {
        type: Sequelize.ENUM('proximo_passo', 'risco_perda', 'melhor_momento', 'personalizacao'),
        defaultValue: 'proximo_passo',
      },
      titulo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      descricao: Sequelize.TEXT,
      acao_sugerida: Sequelize.STRING,
      prioridade: {
        type: Sequelize.ENUM('baixa', 'media', 'alta'),
        defaultValue: 'media',
      },
      visualizado: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      criado_em: Sequelize.DATE,
    });

    await queryInterface.addIndex('recomendacoes_ia', ['cliente_id', 'visualizado'], {
      name: 'idx_recomendacoes_cliente_visualizado',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('recomendacoes_ia');
    await queryInterface.dropTable('previsoes_ia');
    await queryInterface.dropTable('analise_sentimento');
    await queryInterface.dropTable('metricas_vendas');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_recomendacoes_ia_prioridade"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_recomendacoes_ia_tipo"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_previsoes_ia_tipo"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_analise_sentimento_sentimento"');
  },
};
