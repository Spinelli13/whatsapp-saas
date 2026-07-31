'use strict';

/**
 * Seeder: 000_populate_modulos.js
 *
 * Populates the modulos table with the 7 system modules.
 *
 * Must run BEFORE seed 001 (master user creation) because seed 001
 * queries this table to associate modules to plans. sequelize-cli's
 * db:seed:all runs seeders in filename order, so this is prefixed
 * 000 (instead of 002) to sort ahead of 001_master_user.js.
 *
 * Modules:
 * 1. whatsapp         - WhatsApp integration
 * 2. analytics        - Analytics and reports
 * 3. ia               - Artificial intelligence
 * 4. roteamento       - Intelligent routing
 * 5. transferencias   - Conversation transfer
 * 6. respostas_rapidas - Quick replies
 * 7. notas_internas   - Internal notes
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🌱 Starting seed: 000_populate_modulos.js');

      // Define the 7 modules
      const modulos = [
        {
          nome: 'whatsapp',
          descricao: 'Integração WhatsApp - gerenciar conversas e atendimento',
          criado_em: new Date()
        },
        {
          nome: 'analytics',
          descricao: 'Analytics e Relatórios - visualizar métricas e performance',
          criado_em: new Date()
        },
        {
          nome: 'ia',
          descricao: 'Inteligência Artificial - respostas automáticas com IA',
          criado_em: new Date()
        },
        {
          nome: 'roteamento',
          descricao: 'Roteamento Inteligente - distribuir conversas automaticamente',
          criado_em: new Date()
        },
        {
          nome: 'transferencias',
          descricao: 'Transferência de Conversas - passar para outro atendente',
          criado_em: new Date()
        },
        {
          nome: 'respostas_rapidas',
          descricao: 'Respostas Rápidas - templates de mensagens pré-definidas',
          criado_em: new Date()
        },
        {
          nome: 'notas_internas',
          descricao: 'Notas Internas - anotações privadas sobre conversas',
          criado_em: new Date()
        }
      ];

      console.log('  📝 Inserting 7 modules...');

      // Insert modules into database
      // ignoreDuplicates: if module already exists (nome is unique), skip it
      await queryInterface.bulkInsert('modulos', modulos, {
        ignoreDuplicates: true, // Don't error if already exists
        individualHooks: false,
        validate: false
      });

      console.log('  ✅ Modules inserted:');
      modulos.forEach((mod, index) => {
        console.log(`     ${index + 1}. ${mod.nome}: ${mod.descricao}`);
      });

      // Verify insertion
      const [result] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM modulos'
      );

      const count = result[0]?.count || 0;
      console.log(`\n  📊 Total modules in database: ${count}`);

      if (count < 7) {
        console.warn(`  ⚠️  Only ${count} modules found, expected 7`);
      } else {
        console.log('  ✅ All 7 modules present');
      }

      console.log('\n✅ Seed 000_populate_modulos.js completed successfully!');
      console.log('\n🎯 Next: Seed 001_master_user.js can now run (modulos exist)');

    } catch (error) {
      console.error('❌ Error in seed 000_populate_modulos.js:');
      console.error(error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Reverting seed: 000_populate_modulos.js');

      // Delete the modules we inserted
      const modulosNomes = [
        'whatsapp',
        'analytics',
        'ia',
        'roteamento',
        'transferencias',
        'respostas_rapidas',
        'notas_internas'
      ];

      await queryInterface.bulkDelete('modulos', {
        nome: modulosNomes
      });

      console.log('  ✅ Deleted 7 modules');
      console.log('\n✅ Revert completed successfully');

    } catch (error) {
      console.error('❌ Error reverting seed:');
      console.error(error.message);
      throw error;
    }
  }
};
