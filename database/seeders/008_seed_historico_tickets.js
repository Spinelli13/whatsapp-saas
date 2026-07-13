'use strict';

const TICKET_1  = '11111111-1111-4111-8111-111111111111';
const TICKET_2  = '22222222-2222-4222-8222-222222222222';
const TICKET_C2 = '33333333-3333-4333-8333-333333333333';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const t = (hoursAgo) => new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    await queryInterface.bulkInsert(
      'historico_tickets',
      [
        // TICKET_1 — criado → respondendo
        {
          id: '10000001-0001-4000-8000-000000000001',
          ticket_id: TICKET_1,
          usuario_id: null,
          acao: 'criado',
          dados_anteriores: null,
          dados_novos: JSON.stringify({ cliente_id: 1, departamento_id: 1, telefone: '5585991000001' }),
          criado_em: t(48),
        },
        {
          id: '10000001-0001-4000-8000-000000000002',
          ticket_id: TICKET_1,
          usuario_id: 2,
          acao: 'status_alterado',
          dados_anteriores: JSON.stringify({ ticket_status: 'novo' }),
          dados_novos: JSON.stringify({ ticket_status: 'respondendo' }),
          criado_em: t(24),
        },
        {
          id: '10000001-0001-4000-8000-000000000003',
          ticket_id: TICKET_1,
          usuario_id: 2,
          acao: 'nota_adicionada',
          dados_anteriores: null,
          dados_novos: JSON.stringify({ nota_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', privada: false }),
          criado_em: t(25),
        },
        // TICKET_2 — criado → respondendo → resolvido
        {
          id: '20000002-0002-4000-8000-000000000001',
          ticket_id: TICKET_2,
          usuario_id: null,
          acao: 'criado',
          dados_anteriores: null,
          dados_novos: JSON.stringify({ cliente_id: 1, departamento_id: 2, telefone: '5585991000002' }),
          criado_em: t(49),
        },
        {
          id: '20000002-0002-4000-8000-000000000002',
          ticket_id: TICKET_2,
          usuario_id: 3,
          acao: 'status_alterado',
          dados_anteriores: JSON.stringify({ ticket_status: 'novo' }),
          dados_novos: JSON.stringify({ ticket_status: 'respondendo' }),
          criado_em: t(48),
        },
        {
          id: '20000002-0002-4000-8000-000000000003',
          ticket_id: TICKET_2,
          usuario_id: 3,
          acao: 'status_alterado',
          dados_anteriores: JSON.stringify({ ticket_status: 'respondendo' }),
          dados_novos: JSON.stringify({ ticket_status: 'resolvido' }),
          criado_em: t(24),
        },
        {
          id: '20000002-0002-4000-8000-000000000004',
          ticket_id: TICKET_2,
          usuario_id: null,
          acao: 'rating_adicionado',
          dados_anteriores: null,
          dados_novos: JSON.stringify({ rating: 5 }),
          criado_em: t(20),
        },
        // TICKET_C2 — criado
        {
          id: '30000003-0003-4000-8000-000000000001',
          ticket_id: TICKET_C2,
          usuario_id: null,
          acao: 'criado',
          dados_anteriores: null,
          dados_novos: JSON.stringify({ cliente_id: 2, departamento_id: 5, telefone: '5585991000003' }),
          criado_em: t(24),
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'historico_tickets',
      { ticket_id: [TICKET_1, TICKET_2, TICKET_C2] },
      {}
    );
  },
};
