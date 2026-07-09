'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'atendente_departamentos',
      [
        // Ana (id=2) → Vendas (1) + Suporte (2) do cliente 1
        { id: 1, usuario_id: 2, departamento_id: 1, status: 'ativo', created_at: now },
        { id: 2, usuario_id: 2, departamento_id: 2, status: 'ativo', created_at: now },
        // Bruno (id=3) → Suporte (2) do cliente 1
        { id: 3, usuario_id: 3, departamento_id: 2, status: 'ativo', created_at: now },
        // Carlos (id=5) → Vendas Náutica (5) do cliente 2
        { id: 4, usuario_id: 5, departamento_id: 5, status: 'ativo', created_at: now },
      ],
      { ignoreDuplicates: true }
    );

    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('atendente_departamentos', 'id'), (SELECT MAX(id) FROM atendente_departamentos))"
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('atendente_departamentos', { id: [1, 2, 3, 4] }, {});
  },
};
