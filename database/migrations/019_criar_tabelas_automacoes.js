'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workflows', {
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
      nome: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      descricao: Sequelize.TEXT,
      tipo: {
        type: Sequelize.ENUM('trigger_manual', 'trigger_evento', 'agendado'),
        defaultValue: 'trigger_manual',
      },
      status: {
        type: Sequelize.ENUM('ativo', 'inativo', 'pausado'),
        defaultValue: 'ativo',
      },
      definicao: Sequelize.JSON,
      fluxo_visual: Sequelize.JSON,
      execucoes_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      criado_em: Sequelize.DATE,
      atualizado_em: Sequelize.DATE,
    });

    await queryInterface.addIndex('workflows', ['cliente_id', 'status'], {
      name: 'idx_workflows_cliente_status',
    });

    await queryInterface.createTable('triggers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      workflow_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'workflows', key: 'id' },
        onDelete: 'CASCADE',
      },
      tipo: {
        type: Sequelize.ENUM(
          'oportunidade_criada',
          'oportunidade_atualizada',
          'oportunidade_ganha',
          'oportunidade_perdida',
          'tarefa_criada',
          'tarefa_concluida',
          'email_enviado',
          'sms_enviado',
          'data_vencimento',
          'webhook'
        ),
        allowNull: false,
      },
      condicoes: Sequelize.JSON,
      criado_em: Sequelize.DATE,
      atualizado_em: Sequelize.DATE,
    });

    await queryInterface.createTable('acoes_automacao', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      workflow_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'workflows', key: 'id' },
        onDelete: 'CASCADE',
      },
      sequencia: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tipo: {
        type: Sequelize.ENUM(
          'atualizar_campo',
          'criar_tarefa',
          'enviar_email',
          'enviar_sms',
          'mover_oportunidade',
          'atribuir_usuario',
          'adicionar_tag',
          'webhook'
        ),
        allowNull: false,
      },
      parametros: Sequelize.JSON,
      criado_em: Sequelize.DATE,
      atualizado_em: Sequelize.DATE,
    });

    await queryInterface.createTable('execucoes_workflow', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      workflow_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'workflows', key: 'id' },
        onDelete: 'CASCADE',
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
      tarefa_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'tarefas', key: 'id' },
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('pendente', 'executando', 'sucesso', 'erro'),
        defaultValue: 'pendente',
      },
      resultado: Sequelize.JSON,
      erro_mensagem: Sequelize.TEXT,
      data_inicio: Sequelize.DATE,
      data_fim: Sequelize.DATE,
      criado_em: Sequelize.DATE,
    });

    await queryInterface.addIndex('execucoes_workflow', ['cliente_id', 'status'], {
      name: 'idx_execucoes_cliente_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('execucoes_workflow');
    await queryInterface.dropTable('acoes_automacao');
    await queryInterface.dropTable('triggers');
    await queryInterface.dropTable('workflows');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_execucoes_workflow_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_acoes_automacao_tipo"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_triggers_tipo"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_workflows_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_workflows_tipo"');
  },
};
