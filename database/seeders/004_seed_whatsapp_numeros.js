'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'whatsapp_numeros',
      [
        { id: 1, cliente_id: 1, numero: '+5585988776543', status: 'pendente', integrado_em: null, ultima_msg: null, created_at: now, updated_at: now },
        { id: 2, cliente_id: 2, numero: '+5585999887766', status: 'pendente', integrado_em: null, ultima_msg: null, created_at: now, updated_at: now },
      ],
      { ignoreDuplicates: true }
    );

    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('whatsapp_numeros', 'id'), (SELECT MAX(id) FROM whatsapp_numeros))"
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('whatsapp_numeros', { id: [1, 2] }, {});
  },
};
