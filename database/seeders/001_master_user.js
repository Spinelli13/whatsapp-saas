'use strict';

/**
 * Seeder: 001_master_user.js
 *
 * Creates initial data:
 * 1. Master user (the system owner - you)
 *    Email: sistemasimediatos
 *    Password: simaster13 (hashed)
 *    Role: master
 *
 * 2. Default plans with modules:
 *    - Plano Básico: R$ 299/mês, only WhatsApp module
 *    - Plano Pro: R$ 799/mês, all 7 modules
 *
 * 3. Associations in planos_modulos table
 *
 * Run with: npm run db:seed
 */

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🌱 Starting seed: 001_master_user.js');

      // ═══════════════════════════════════════════════════════════════════
      // 1. CREATE MASTER USER
      // ═══════════════════════════════════════════════════════════════════

      console.log('  📝 Creating master user...');

      const hashedPassword = await bcrypt.hash('simaster13', 10);

      await queryInterface.bulkInsert('usuarios', [
        {
          email: 'sistemasimediatos',
          nome: 'SI-CRM Master',
          senha: hashedPassword,
          cliente_id: null, // Master doesn't belong to any client
          role: 'master', // NEW role we added in migration 034
          status: 'ativo',
          data_criacao: new Date(),
          data_atualizacao: new Date(),
        }
      ], {
        individualHooks: false, // Don't trigger hooks for seed data
        validate: false // Skip model validations
      });

      console.log('  ✅ Master user created');
      console.log('     Email: sistemasimediatos');
      console.log('     Password: simaster13');

      // ═══════════════════════════════════════════════════════════════════
      // 2. CREATE DEFAULT PLANS
      // ═══════════════════════════════════════════════════════════════════

      console.log('  📝 Creating default plans...');

      const planos = [
        {
          nome: 'Básico',
          descricao: 'Plano básico ideal para pequenas empresas começarem com WhatsApp',
          preco_mensal: 299.00,
          usuarios_limite: 5,
          mensagens_limite: 1000,
          departamentos_limite: 2,
          // features não será usado no novo sistema (usaremos planos_modulos)
          // mas mantemos para compatibilidade com código existente
          features: JSON.stringify(['whatsapp']),
          criado_em: new Date()
        },
        {
          nome: 'Pro',
          descricao: 'Plano profissional com acesso a todos os módulos do SI-CRM',
          preco_mensal: 799.00,
          usuarios_limite: 20,
          mensagens_limite: 10000,
          departamentos_limite: 10,
          features: JSON.stringify([
            'whatsapp',
            'analytics',
            'ia',
            'roteamento',
            'transferencias',
            'respostas_rapidas',
            'notas_internas'
          ]),
          criado_em: new Date()
        }
      ];

      await queryInterface.bulkInsert('planos', planos, {
        individualHooks: false,
        validate: false
      });

      console.log('  ✅ Plans created:');
      console.log('     - Básico: R$ 299/mês (5 users, 1000 msgs)');
      console.log('     - Pro: R$ 799/mês (20 users, 10000 msgs)');

      // ═══════════════════════════════════════════════════════════════════
      // 3. ASSOCIATE MODULES TO PLANS (planos_modulos)
      // ═══════════════════════════════════════════════════════════════════

      console.log('  📝 Associating modules to plans...');

      // Fetch the plans we just created
      const [basicoPlanos] = await queryInterface.sequelize.query(
        "SELECT id FROM planos WHERE nome = 'Básico' LIMIT 1"
      );

      const [proPlanos] = await queryInterface.sequelize.query(
        "SELECT id FROM planos WHERE nome = 'Pro' LIMIT 1"
      );

      if (!basicoPlanos || !basicoPlanos[0]) {
        throw new Error('Failed to find Básico plan after creation');
      }
      if (!proPlanos || !proPlanos[0]) {
        throw new Error('Failed to find Pro plan after creation');
      }

      const basicoPlanoId = basicoPlanos[0].id;
      const proPlanoId = proPlanos[0].id;

      console.log('     Plano Básico ID:', basicoPlanoId);
      console.log('     Plano Pro ID:', proPlanoId);

      // Fetch all modules
      const [todosModulos] = await queryInterface.sequelize.query(
        'SELECT id, nome FROM modulos'
      );

      if (!todosModulos || todosModulos.length === 0) {
        throw new Error('No modules found. Ensure modulos table is populated');
      }

      console.log('     Found', todosModulos.length, 'modules in system');

      // Plano Básico: only whatsapp module
      const whatsappModulo = todosModulos.find(m => m.nome === 'whatsapp');
      if (!whatsappModulo) {
        throw new Error('Module "whatsapp" not found. Ensure modulos table has it');
      }

      const basicoModulos = [
        {
          plano_id: basicoPlanoId,
          modulo_id: whatsappModulo.id,
          data_adicionado: new Date()
        }
      ];

      await queryInterface.bulkInsert('planos_modulos', basicoModulos, {
        individualHooks: false,
        validate: false
      });

      console.log('  ✅ Plano Básico modules: whatsapp');

      // Plano Pro: all modules
      const proModulos = todosModulos.map(modulo => ({
        plano_id: proPlanoId,
        modulo_id: modulo.id,
        data_adicionado: new Date()
      }));

      await queryInterface.bulkInsert('planos_modulos', proModulos, {
        individualHooks: false,
        validate: false
      });

      console.log('  ✅ Plano Pro modules:', todosModulos.map(m => m.nome).join(', '));

      // ═══════════════════════════════════════════════════════════════════
      // 4. SUMMARY
      // ═══════════════════════════════════════════════════════════════════

      console.log('\n✅ Seed 001_master_user.js completed successfully!');
      console.log('\n📊 Summary:');
      console.log('   Master User: sistemasimediatos (password: simaster13)');
      console.log('   Plans: 2 (Básico, Pro)');
      console.log('   Modules: ' + todosModulos.length);
      console.log('   Associations: ' + (basicoModulos.length + proModulos.length));
      console.log('\n🎯 Next step: Run migrations with npm run db:migrate');

    } catch (error) {
      console.error('❌ Error in seed 001_master_user.js:');
      console.error(error.message);
      throw error; // Re-throw to fail the migration
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Reverting seed: 001_master_user.js');

      // Delete in reverse order of dependencies

      // 1. Delete planos_modulos associations
      await queryInterface.bulkDelete('planos_modulos', {
        plano_id: {
          [Sequelize.Op.in]: (await queryInterface.sequelize.query(
            "SELECT id FROM planos WHERE nome IN ('Básico', 'Pro')"
          ))[0].map(p => p.id)
        }
      });

      console.log('  ✅ Deleted planos_modulos associations');

      // 2. Delete plans
      await queryInterface.bulkDelete('planos', {
        nome: ['Básico', 'Pro']
      });

      console.log('  ✅ Deleted plans');

      // 3. Delete master user
      await queryInterface.bulkDelete('usuarios', {
        email: 'sistemasimediatos'
      });

      console.log('  ✅ Deleted master user');
      console.log('\n✅ Revert completed successfully');

    } catch (error) {
      console.error('❌ Error reverting seed:');
      console.error(error.message);
      throw error;
    }
  }
};
