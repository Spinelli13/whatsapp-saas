'use strict';

/**
 * Migration: Create cliente_modulos table (Many-to-Many relationship)
 *
 * Tracks which modules each client has access to.
 * This is created when a master assigns a plan to a client,
 * and the plan's modules are associated to the client.
 *
 * Table: cliente_modulos
 * Relationships:
 *   - cliente_id → clientes.id (CASCADE delete)
 *   - modulo_id → modulos.id (CASCADE delete)
 *
 * Unique constraint: (cliente_id, modulo_id) to prevent duplicates
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. CREATE THE TABLE
    await queryInterface.createTable('cliente_modulos', {
      // Primary key - auto increment
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for this M2M relationship'
      },

      // Foreign key: cliente_id
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id'
        },
        onDelete: 'CASCADE', // If client deleted, remove all their module associations
        comment: 'Reference to the client that has this module'
      },

      // Foreign key: modulo_id
      modulo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'modulos',
          key: 'id'
        },
        onDelete: 'CASCADE', // If module deleted, remove from all clients
        comment: 'Reference to the module'
      },

      // Timestamp: when this module was added to the client
      data_adicionado: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        comment: 'When this module was added to the client'
      }
    });

    // 2. ADD UNIQUE INDEX to prevent duplicate (cliente_id, modulo_id) pairs
    await queryInterface.addIndex(
      'cliente_modulos',
      ['cliente_id', 'modulo_id'],
      {
        unique: true,
        name: 'unique_cliente_modulo',
        comment: 'Ensures a client cannot have the same module twice'
      }
    );

    // 3. ADD INDEX on cliente_id for fast lookups
    // "Give me all modules for cliente_id = 5" queries will be fast
    await queryInterface.addIndex(
      'cliente_modulos',
      ['cliente_id'],
      {
        name: 'idx_cliente_modulos_cliente_id',
        comment: 'For fast queries: find all modules for a specific client'
      }
    );

    console.log('✅ Table cliente_modulos created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // ROLLBACK: Drop the table if needed
    // Sequelize will automatically drop indexes first

    await queryInterface.dropTable('cliente_modulos');

    console.log('✅ Table cliente_modulos dropped successfully');
  }
};
