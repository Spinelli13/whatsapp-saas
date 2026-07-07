'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'clientes',
      [
        { id: 1, nome: 'Cliente 1 - Vendas',  plano: 'profissional', status: 'ativo', data_criacao: now, data_atualizacao: now },
        { id: 2, nome: 'Barcos e Barcos',     plano: 'basico',       status: 'ativo', data_criacao: now, data_atualizacao: now },
      ],
      { ignoreDuplicates: true }
    );

    // Atualiza sequence para não conflitar com inserts futuros
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('clientes', 'id'), (SELECT MAX(id) FROM clientes))"
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('clientes', { id: [1, 2] }, {});
  },
};
