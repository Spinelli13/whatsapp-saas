'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const renovacao = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert('cliente_plano', [
      // Cliente 1 (Vendas Pro) → Profissional (id 2)
      {
        cliente_id: 1,
        plano_id: 2,
        data_inicio: now,
        data_proxima_renovacao: renovacao,
        status: 'ativo',
        criado_em: now,
      },
      // Cliente 2 (Barcos e Barcos) → Básico (id 1)
      {
        cliente_id: 2,
        plano_id: 1,
        data_inicio: now,
        data_proxima_renovacao: renovacao,
        status: 'ativo',
        criado_em: now,
      },
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('cliente_plano', {
      cliente_id: [1, 2],
    }, {});
  },
};
