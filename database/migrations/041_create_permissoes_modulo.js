'use strict';

/**
 * Migration: Create permissoes_modulo table
 *
 * Per-attendant, per-module access toggle used by AdminController
 * (criarAtendente / definirPermissoesAtendente / obterPermissoesAtendente).
 *
 * Deliberately separate from the existing `permissoes` table, which backs
 * the older RBAC system (nome/descricao/categoria, linked to Role via
 * RolePermissao) and has a different shape and purpose.
 *
 * Table: permissoes_modulo
 * Relationships:
 *   - usuario_id → usuarios.id (CASCADE)
 *   - modulo_id → modulos.id (CASCADE)
 *
 * Unique constraint: (usuario_id, modulo_id) to prevent duplicates
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('permissoes_modulo', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
      },
      modulo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'modulos', key: 'id' },
        onDelete: 'CASCADE',
      },
      ativado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('permissoes_modulo', ['usuario_id', 'modulo_id'], {
      unique: true,
      name: 'unique_usuario_modulo',
    });

    await queryInterface.addIndex('permissoes_modulo', ['usuario_id'], {
      name: 'idx_permissoes_modulo_usuario_id',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('permissoes_modulo');
  },
};
