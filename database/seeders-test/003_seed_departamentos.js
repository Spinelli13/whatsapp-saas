'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'departamentos',
      [
        // Cliente 1 (IDs 1-4)
        { id: 1, cliente_id: 1, nome: 'Vendas',      emoji: '🛒', descricao: 'Equipe de vendas e orçamentos', ativo: true, created_at: now, updated_at: now },
        { id: 2, cliente_id: 1, nome: 'Suporte',     emoji: '🔧', descricao: 'Suporte técnico e pós-venda',   ativo: true, created_at: now, updated_at: now },
        { id: 3, cliente_id: 1, nome: 'Financeiro',  emoji: '💰', descricao: 'Pagamentos e cobranças',         ativo: true, created_at: now, updated_at: now },
        { id: 4, cliente_id: 1, nome: 'RH',          emoji: '👥', descricao: 'Recursos humanos',               ativo: true, created_at: now, updated_at: now },
        // Cliente 2 (IDs 5-6)
        { id: 5, cliente_id: 2, nome: 'Vendas Náutica',  emoji: '⛵', descricao: 'Lancha, Jetski, UTV e Quadriciclo', ativo: true, created_at: now, updated_at: now },
        { id: 6, cliente_id: 2, nome: 'Suporte Náutico', emoji: '🔧', descricao: 'Revisão e pós-venda náutico',        ativo: true, created_at: now, updated_at: now },
      ],
      { ignoreDuplicates: true }
    );

    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('departamentos', 'id'), (SELECT MAX(id) FROM departamentos))"
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('departamentos', { id: [1, 2, 3, 4, 5, 6] }, {});
  },
};
