'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('emails', {
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
        references: { model: 'usuarios', key: 'id' },
      },
      destinatario_email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      assunto: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      corpo: Sequelize.TEXT,
      tipo: {
        type: Sequelize.ENUM('enviado', 'recebido'),
        defaultValue: 'enviado',
      },
      status: {
        type: Sequelize.ENUM('rascunho', 'enviando', 'enviado', 'erro'),
        defaultValue: 'rascunho',
      },
      oportunidade_id: {
        type: Sequelize.UUID,
        references: { model: 'oportunidades', key: 'id' },
        allowNull: true,
        onDelete: 'SET NULL',
      },
      tarefa_id: {
        type: Sequelize.UUID,
        references: { model: 'tarefas', key: 'id' },
        allowNull: true,
        onDelete: 'SET NULL',
      },
      anexos: Sequelize.JSONB,
      mensagem_id_externo: Sequelize.STRING,
      erro_mensagem: Sequelize.TEXT,
      data_envio: Sequelize.DATE,
      criado_em: Sequelize.DATE,
      atualizado_em: Sequelize.DATE,
    });

    await queryInterface.createTable('sms', {
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
        references: { model: 'usuarios', key: 'id' },
      },
      numero_destino: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mensagem: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      tipo: {
        type: Sequelize.ENUM('enviado', 'recebido'),
        defaultValue: 'enviado',
      },
      status: {
        type: Sequelize.ENUM('rascunho', 'enviando', 'enviado', 'erro'),
        defaultValue: 'rascunho',
      },
      oportunidade_id: {
        type: Sequelize.UUID,
        references: { model: 'oportunidades', key: 'id' },
        allowNull: true,
        onDelete: 'SET NULL',
      },
      tarefa_id: {
        type: Sequelize.UUID,
        references: { model: 'tarefas', key: 'id' },
        allowNull: true,
        onDelete: 'SET NULL',
      },
      sid_externo: Sequelize.STRING,
      erro_mensagem: Sequelize.TEXT,
      data_envio: Sequelize.DATE,
      criado_em: Sequelize.DATE,
      atualizado_em: Sequelize.DATE,
    });

    await queryInterface.createTable('configuracao_comunicacao', {
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
      smtp_host: Sequelize.STRING,
      smtp_porta: Sequelize.INTEGER,
      smtp_usuario: Sequelize.STRING,
      smtp_senha: Sequelize.STRING,
      imap_host: Sequelize.STRING,
      imap_porta: Sequelize.INTEGER,
      imap_usuario: Sequelize.STRING,
      imap_senha: Sequelize.STRING,
      email_padrao: Sequelize.STRING,
      twilio_account_sid: Sequelize.STRING,
      twilio_auth_token: Sequelize.STRING,
      twilio_numero: Sequelize.STRING,
      notificar_email_recebido: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      notificar_sms_recebido: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      criado_em: Sequelize.DATE,
      atualizado_em: Sequelize.DATE,
    });

    await queryInterface.addIndex('emails', ['cliente_id', 'status']);
    await queryInterface.addIndex('emails', ['cliente_id', 'tipo']);
    await queryInterface.addIndex('sms', ['cliente_id', 'status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('configuracao_comunicacao');
    await queryInterface.dropTable('sms');
    await queryInterface.dropTable('emails');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_emails_tipo"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_emails_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sms_tipo"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sms_status"');
  },
};
