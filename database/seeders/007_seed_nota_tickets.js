'use strict';

const TICKET_1 = '11111111-1111-4111-8111-111111111111';
const TICKET_2 = '22222222-2222-4222-8222-222222222222';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const h1 = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const h2 = new Date(now.getTime() - 20 * 60 * 60 * 1000);
    const h3 = new Date(now.getTime() - 15 * 60 * 60 * 1000);
    const h4 = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    const h5 = new Date(now.getTime() -  5 * 60 * 60 * 1000);

    await queryInterface.bulkInsert(
      'nota_tickets',
      [
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          ticket_id: TICKET_1,
          usuario_id: 2, // Ana
          conteudo: 'Cliente confirmou que vai comprar o pacote premium.',
          privada: false,
          criado_em: h1,
          atualizado_em: h1,
        },
        {
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          ticket_id: TICKET_1,
          usuario_id: 1, // admin
          conteudo: 'Pendente aprovação financeira antes de fechar.',
          privada: true,
          criado_em: h2,
          atualizado_em: h2,
        },
        {
          id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          ticket_id: TICKET_1,
          usuario_id: 2, // Ana
          conteudo: 'Enviado catálogo completo por email.',
          privada: false,
          criado_em: h3,
          atualizado_em: h3,
        },
        {
          id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          ticket_id: TICKET_2,
          usuario_id: 3, // Bruno
          conteudo: 'Pedido rastreado: código PQ123456789BR, em trânsito.',
          privada: false,
          criado_em: h4,
          atualizado_em: h4,
        },
        {
          id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          ticket_id: TICKET_2,
          usuario_id: 3, // Bruno
          conteudo: 'Cliente confirmou recebimento. Ticket resolvido.',
          privada: false,
          criado_em: h5,
          atualizado_em: h5,
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'nota_tickets',
      {
        id: [
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        ],
      },
      {}
    );
  },
};
