'use strict';

// Verifica conexão com o banco antes de rodar qualquer teste.
// Roda UMA VEZ antes de todos os suites.
module.exports = async () => {
  require('dotenv').config();
  const { Sequelize } = require('sequelize');
  const config = require('../src/backend/config/database').development;

  const s = new Sequelize(config.url, { dialect: 'postgres', logging: false });
  try {
    await s.authenticate();
    await s.close();
    console.log('\n✓ Banco de dados acessível — iniciando testes\n');
  } catch (err) {
    console.error('\n✗ Banco de dados inacessível.');
    console.error('  Rode: npm run docker:up && npm run db:migrate && npm run db:seed\n');
    throw err;
  }
};
