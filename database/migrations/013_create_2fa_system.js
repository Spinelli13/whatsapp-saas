'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── 1. usuario_2fa ─────────────────────────────────────────────────────
    await queryInterface.createTable('usuario_2fa', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
      },
      tipo: {
        type: Sequelize.ENUM('sms', 'totp', 'none'),
        defaultValue: 'none',
      },
      telefone_2fa: { type: Sequelize.STRING(20), allowNull: true },
      totp_secret: { type: Sequelize.STRING(500), allowNull: true },
      ativado: { type: Sequelize.BOOLEAN, defaultValue: false },
      backup_codes: { type: Sequelize.JSONB, defaultValue: [] },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      atualizado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.addIndex('usuario_2fa', ['usuario_id'], { unique: true });

    // ── 2. dispositivo_usuario ─────────────────────────────────────────────
    await queryInterface.createTable('dispositivo_usuario', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
      },
      nome: { type: Sequelize.STRING(255), allowNull: true },
      device_id: { type: Sequelize.STRING(255), allowNull: false },
      user_agent: { type: Sequelize.TEXT, allowNull: true },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      ultimo_acesso: { type: Sequelize.DATE, allowNull: true },
      trusted: { type: Sequelize.BOOLEAN, defaultValue: false },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });

    // Unique per user-device pair (not globally unique — multiple users can share a browser)
    await queryInterface.addIndex('dispositivo_usuario', ['usuario_id', 'device_id'], { unique: true });

    // ── 3. sessao_usuario ──────────────────────────────────────────────────
    await queryInterface.createTable('sessao_usuario', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
      },
      token_refresh: { type: Sequelize.STRING(500), allowNull: false, unique: true },
      dispositivo_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'dispositivo_usuario', key: 'id' },
        onDelete: 'SET NULL',
      },
      expira_em: { type: Sequelize.DATE, allowNull: false },
      ativa: { type: Sequelize.BOOLEAN, defaultValue: true },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.addIndex('sessao_usuario', ['usuario_id', 'ativa']);
    await queryInterface.addIndex('sessao_usuario', ['token_refresh'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sessao_usuario');
    await queryInterface.dropTable('dispositivo_usuario');
    await queryInterface.dropTable('usuario_2fa');
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_usuario_2fa_tipo"`);
  },
};
