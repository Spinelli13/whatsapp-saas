'use strict';

// UUIDs fixos para referência nos seeders 007 e 008
const TICKET_1 = '11111111-1111-4111-8111-111111111111'; // cliente 1, dept 1 (Vendas)
const TICKET_2 = '22222222-2222-4222-8222-222222222222'; // cliente 1, dept 2 (Suporte)
const TICKET_C2 = '33333333-3333-4333-8333-333333333333'; // cliente 2, dept 5 (Vendas Náutica)

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const dia1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 dias atrás
    const dia2 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 dia atrás

    await queryInterface.bulkInsert(
      'fila_mensagens',
      [
        {
          id: TICKET_1,
          cliente_id: 1,
          departamento_id: 1,
          telefone: '5585991000001',
          texto: 'Olá, gostaria de mais informações sobre os produtos.',
          status: 'atribuido',
          ticket_status: 'respondendo',
          atendente_id: 2, // Ana
          posicao_fila: null,
          satisfaction_rating: null,
          respondido_por: 2,
          respondido_em: dia2,
          created_at: dia1,
          updated_at: dia2,
        },
        {
          id: TICKET_2,
          cliente_id: 1,
          departamento_id: 2,
          telefone: '5585991000002',
          texto: 'Meu pedido não chegou ainda.',
          status: 'fechado',
          ticket_status: 'resolvido',
          atendente_id: 3, // Bruno
          posicao_fila: null,
          satisfaction_rating: 5,
          respondido_por: 3,
          respondido_em: dia1,
          created_at: new Date(dia1.getTime() - 60 * 60 * 1000),
          updated_at: dia1,
        },
        {
          id: TICKET_C2,
          cliente_id: 2,
          departamento_id: 5,
          telefone: '5585991000003',
          texto: 'Quero comprar um barco.',
          status: 'aguardando',
          ticket_status: 'novo',
          atendente_id: null,
          posicao_fila: 1,
          satisfaction_rating: null,
          respondido_por: null,
          respondido_em: null,
          created_at: dia2,
          updated_at: dia2,
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'fila_mensagens',
      { id: [TICKET_1, TICKET_2, TICKET_C2] },
      {}
    );
  },
};
