'use strict';

/**
 * Migration: Create modulos table
 *
 * Stores the 7 modules available in SI-CRM system:
 * 1. whatsapp
 * 2. analytics
 * 3. ia
 * 4. roteamento
 * 5. transferencias
 * 6. respostas_rapidas
 * 7. notas_internas
 *
 * Table: modulos
 * Columns:
 *   - id: auto-increment primary key
 *   - nome: unique module name
 *   - descricao: human-readable description
 *   - criado_em: timestamp
 *
 * This table is referenced by:
 *   - planos_modulos (many-to-many: which modules in each plan)
 *   - cliente_modulos (many-to-many: which modules each client has)
 *   - permissoes (which modules each user can access)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists (from previous migrations)
    const tableExists = await queryInterface.tableExists('modulos');

    if (tableExists) {
      console.log('✅ Table modulos already exists, skipping creation');
      return;
    }

    console.log('📝 Creating modulos table...');

    // CREATE THE TABLE
    await queryInterface.createTable('modulos', {
      // Primary key
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique module identifier'
      },

      // Module name (unique, cannot have duplicates)
      nome: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique module name (e.g., whatsapp, analytics, ia, etc.)'
      },

      // Module description (human-readable)
      descricao: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Human-readable description of this module'
      },

      // Timestamp: when module was created
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When this module was created'
      }
    });

    // ADD INDEX on nome for fast lookups
    // Query: "Give me the module with nome = 'whatsapp'"
    await queryInterface.addIndex(
      'modulos',
      ['nome'],
      {
        unique: true,
        name: 'idx_modulos_nome_unique',
        comment: 'Unique index on module name for fast lookups'
      }
    );

    console.log('✅ Table modulos created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    // ROLLBACK: Drop the table
    // Only drop if it was created by us (check migration history)
    // For safety: just drop it (down should match up)

    try {
      await queryInterface.dropTable('modulos');
      console.log('✅ Table modulos dropped successfully');
    } catch (error) {
      // Table might not exist, that's OK
      console.log('⚠️ Table modulos not found or already deleted');
    }
  }
};
