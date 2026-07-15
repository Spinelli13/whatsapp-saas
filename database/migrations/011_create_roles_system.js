'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── 1. permissoes (global, não ligada a cliente) ───────────────────────
    await queryInterface.createTable('permissoes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      categoria: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      criado_em: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('permissoes', ['nome'], { unique: true });
    await queryInterface.addIndex('permissoes', ['categoria']);

    // ── 2. roles (por cliente) ─────────────────────────────────────────────
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      nome: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      eh_customizado: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      criado_em: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('roles', ['cliente_id', 'nome'], { unique: true });

    // ── 3. role_permissoes (M2M) ───────────────────────────────────────────
    await queryInterface.createTable('role_permissoes', {
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'CASCADE',
      },
      permissao_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'permissoes', key: 'id' },
        onDelete: 'CASCADE',
      },
      criado_em: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addConstraint('role_permissoes', {
      fields: ['role_id', 'permissao_id'],
      type: 'primary key',
      name: 'pk_role_permissoes',
    });

    await queryInterface.addIndex('role_permissoes', ['role_id', 'permissao_id']);

    // ── 4. adicionar role_id em usuarios ──────────────────────────────────
    await queryInterface.addColumn('usuarios', 'role_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'roles', key: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('usuarios', 'role_id');
    await queryInterface.dropTable('role_permissoes');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('permissoes');
  },
};
