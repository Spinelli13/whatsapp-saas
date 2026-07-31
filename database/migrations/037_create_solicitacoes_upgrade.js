'use strict';

/**
 * Migration: Create solicitacoes_upgrade table
 *
 * Tracks upgrade requests made by client admins:
 * - "I want to upgrade from Basic plan to Pro plan"
 * - "I want to add the Analytics module"
 *
 * Master reviews these requests and approves/rejects them.
 * Cobrança (billing) é manual - não integrada.
 *
 * Table: solicitacoes_upgrade
 * Relationships:
 *   - cliente_id → clientes.id (CASCADE)
 *   - admin_id → usuarios.id (SET NULL) = the admin who requested
 *   - plano_id → planos.id (SET NULL) = plan requested (if tipo='plano')
 *   - modulo_id → modulos.id (SET NULL) = module requested (if tipo='modulo')
 *
 * Status flow: pendente → (aprovado|recusado)
 *
 * Examples:
 *   - Cliente ACN, Admin João solicitou Plano Pro (pendente)
 *   - Cliente Sinal Verde, Admin Maria solicitou módulo Analytics (aprovado)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. CREATE THE TABLE
    await queryInterface.createTable('solicitacoes_upgrade', {
      // Primary key
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique request identifier'
      },

      // Foreign key: cliente_id (which client is requesting)
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id'
        },
        onDelete: 'CASCADE', // If client deleted, delete their requests
        comment: 'The client requesting the upgrade'
      },

      // Foreign key: admin_id (which admin made the request)
      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onDelete: 'SET NULL', // If admin deleted, keep the request record
        comment: 'The client admin who made this request'
      },

      // ENUM tipo: 'plano' or 'modulo'
      tipo: {
        type: Sequelize.ENUM('plano', 'modulo'),
        allowNull: false,
        comment: 'Type of upgrade: "plano" = plan upgrade, "modulo" = add module'
      },

      // Foreign key: plano_id (only populated if tipo='plano')
      plano_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'planos',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'The plan being requested (null if tipo="modulo")'
      },

      // Foreign key: modulo_id (only populated if tipo='modulo')
      modulo_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'modulos',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'The module being requested (null if tipo="plano")'
      },

      // ENUM status: 'pendente', 'aprovado', 'recusado'
      status: {
        type: Sequelize.ENUM('pendente', 'aprovado', 'recusado'),
        allowNull: false,
        defaultValue: 'pendente',
        comment: 'Status of the request: pendente=waiting, aprovado=approved, recusado=rejected'
      },

      // TEXT: reason for rejection (only if status='recusado')
      motivo_recusa: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'If rejected, why? (e.g., "Plano já inclui este módulo")'
      },

      // Timestamp: when request was created
      data_solicitacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When the request was submitted'
      },

      // Timestamp: when request was approved/rejected by master
      data_aprovacao: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the master approved/rejected this request'
      }
    });

    // 2. ADD INDEXES for common queries

    // "Show me all pending requests for cliente_id=5"
    // "Show me all requests with status='pendente'"
    await queryInterface.addIndex(
      'solicitacoes_upgrade',
      ['cliente_id', 'status'],
      {
        name: 'idx_solicitacoes_cliente_status',
        comment: 'For queries: find requests by client and status'
      }
    );

    // "Show me all pending requests across all clients"
    await queryInterface.addIndex(
      'solicitacoes_upgrade',
      ['status'],
      {
        name: 'idx_solicitacoes_status',
        comment: 'For queries: find all pending requests'
      }
    );

    console.log('✅ Table solicitacoes_upgrade created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // ROLLBACK
    // Sequelize handles ENUM type cleanup automatically
    await queryInterface.dropTable('solicitacoes_upgrade');

    console.log('✅ Table solicitacoes_upgrade dropped successfully');
  }
};
