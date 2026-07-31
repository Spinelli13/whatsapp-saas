'use strict';

/**
 * Migration: Create planos_modulos table (Many-to-Many relationship)
 *
 * Tracks which modules are included in each plan.
 * This is set by the master when creating/editing a plan.
 *
 * Table: planos_modulos
 * Relationships:
 *   - plano_id → planos.id (CASCADE delete)
 *   - modulo_id → modulos.id (CASCADE delete)
 *
 * Unique constraint: (plano_id, modulo_id) to prevent duplicates
 *
 * Examples:
 *   - Plano "Básico" has module "whatsapp"
 *   - Plano "Pro" has modules "whatsapp", "analytics", "ia", etc.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. CREATE THE TABLE
    await queryInterface.createTable('planos_modulos', {
      // Primary key - auto increment
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for this M2M relationship'
      },

      // Foreign key: plano_id
      plano_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'planos',
          key: 'id'
        },
        onDelete: 'CASCADE', // If plan deleted, remove all its modules
        comment: 'Reference to the plan'
      },

      // Foreign key: modulo_id
      modulo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'modulos',
          key: 'id'
        },
        onDelete: 'CASCADE', // If module deleted, remove from all plans
        comment: 'Reference to the module included in this plan'
      },

      // Timestamp: when this module was added to the plan
      data_adicionado: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        comment: 'When this module was added to the plan'
      }
    });

    // 2. ADD UNIQUE INDEX to prevent duplicate (plano_id, modulo_id) pairs
    await queryInterface.addIndex(
      'planos_modulos',
      ['plano_id', 'modulo_id'],
      {
        unique: true,
        name: 'unique_plano_modulo',
        comment: 'Ensures a plan cannot include the same module twice'
      }
    );

    // 3. ADD INDEX on plano_id for fast lookups
    // "Give me all modules for plano_id = 2" (e.g., Pro plan) will be fast
    await queryInterface.addIndex(
      'planos_modulos',
      ['plano_id'],
      {
        name: 'idx_planos_modulos_plano_id',
        comment: 'For fast queries: find all modules in a specific plan'
      }
    );

    console.log('✅ Table planos_modulos created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // ROLLBACK: Drop the table if needed
    await queryInterface.dropTable('planos_modulos');

    console.log('✅ Table planos_modulos dropped successfully');
  }
};
