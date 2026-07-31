'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_usuarios_role ADD VALUE 'master' BEFORE 'admin';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // PostgreSQL não permite remover valores do ENUM facilmente
    // Deixar vazio é normal
  }
};
