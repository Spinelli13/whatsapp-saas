'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tarefas', {
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
      titulo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      descricao: Sequelize.TEXT,
      status: {
        type: Sequelize.ENUM('todo', 'em_progresso', 'concluida'),
        defaultValue: 'todo',
      },
      prioridade: {
        type: Sequelize.ENUM('baixa', 'media', 'alta', 'critica'),
        defaultValue: 'media',
      },
      usuario_atribuido_id: {
        type: Sequelize.INTEGER,
        references: { model: 'usuarios', key: 'id' },
        allowNull: true,
        onDelete: 'SET NULL',
      },
      usuario_criador_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
      },
      data_vencimento: Sequelize.DATE,
      data_inicio: Sequelize.DATE,
      data_conclusao: Sequelize.DATE,
      tags: Sequelize.JSONB,
      oportunidade_id: {
        type: Sequelize.UUID,
        references: { model: 'oportunidades', key: 'id' },
        allowNull: true,
        onDelete: 'SET NULL',
      },
      posicao_coluna: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      criado_em: Sequelize.DATE,
      atualizado_em: Sequelize.DATE,
    });

    await queryInterface.createTable('calendario_eventos', {
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
      titulo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      descricao: Sequelize.TEXT,
      data_inicio: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      data_fim: Sequelize.DATE,
      local: Sequelize.STRING,
      tipo: {
        type: Sequelize.ENUM('reuniao', 'chamada', 'visita', 'deadline', 'outro'),
        defaultValue: 'outro',
      },
      cor: Sequelize.STRING(20),
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
      },
      tarefa_id: {
        type: Sequelize.UUID,
        references: { model: 'tarefas', key: 'id' },
        allowNull: true,
        onDelete: 'CASCADE',
      },
      oportunidade_id: {
        type: Sequelize.UUID,
        references: { model: 'oportunidades', key: 'id' },
        allowNull: true,
        onDelete: 'SET NULL',
      },
      participantes: Sequelize.JSONB,
      notificacao: {
        type: Sequelize.ENUM('nenhuma', '15min', '30min', '1h', '1dia'),
        defaultValue: '15min',
      },
      criado_em: Sequelize.DATE,
      atualizado_em: Sequelize.DATE,
    });

    await queryInterface.createTable('configuracao_tarefas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      mostrar_apenas_minhas: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      notificar_atribuicao: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      notificar_vencimento: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      criado_em: Sequelize.DATE,
      atualizado_em: Sequelize.DATE,
    });

    await queryInterface.addIndex('tarefas', ['cliente_id', 'status']);
    await queryInterface.addIndex('tarefas', ['cliente_id', 'usuario_atribuido_id']);
    await queryInterface.addIndex('calendario_eventos', ['cliente_id', 'data_inicio']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('configuracao_tarefas');
    await queryInterface.dropTable('calendario_eventos');
    await queryInterface.dropTable('tarefas');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tarefas_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tarefas_prioridade"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_calendario_eventos_tipo"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_calendario_eventos_notificacao"');
  },
};
