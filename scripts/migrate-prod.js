#!/usr/bin/env node
'use strict';

// Production migration script — uses sequelize-cli (already in devDependencies)
// Usage: NODE_ENV=production node scripts/migrate-prod.js

require('dotenv').config({ path: '.env.production.local' });

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function migrate() {
  console.log('🔄 Iniciando migração de produção...');

  // 1. Verify connection
  try {
    const { Sequelize } = require('sequelize');
    const config = require('../src/backend/config/database').production;
    const s = new Sequelize(config.url || config, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: config.dialectOptions,
    });
    await s.authenticate();
    await s.close();
    console.log('✅ Conexão com banco estabelecida');
  } catch (err) {
    console.error('❌ Não foi possível conectar ao banco:', err.message);
    process.exit(1);
  }

  // 2. Run migrations via sequelize-cli
  try {
    const { stdout, stderr } = await execAsync(
      'npx sequelize-cli db:migrate',
      { env: { ...process.env, NODE_ENV: 'production' } }
    );
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
    console.log('✅ Migrations executadas com sucesso');
  } catch (err) {
    console.error('❌ Erro nas migrations:', err.message);
    process.exit(1);
  }

  // 3. Seed initial data (only if explicitly requested)
  if (process.argv.includes('--seed')) {
    try {
      await seedDatabase();
    } catch (err) {
      console.error('❌ Erro no seed:', err.message);
      process.exit(1);
    }
  }

  console.log('✅ Migração de produção concluída!');
  process.exit(0);
}

async function seedDatabase() {
  console.log('🌱 Iniciando seed de dados iniciais...');
  const { Cliente } = require('../src/backend/models');

  const [cliente, created] = await Cliente.findOrCreate({
    where: { email: 'demo@example.com' },
    defaults: {
      nome: 'Demo Client',
      email: 'demo@example.com',
      telefone: '+5511999999999',
      ativo: true,
    },
  });

  console.log(`✅ Cliente demo ${created ? 'criado' : 'já existia'}: ${cliente.nome}`);
}

migrate();
