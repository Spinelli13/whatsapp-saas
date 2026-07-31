'use strict';

const PLANOS = [
  {
    id: 1,
    nome: 'basico',
    descricao: 'Plano básico para começar',
    preco_mensal: 99.00,
    usuarios_limite: 1,
    mensagens_limite: 1000,
    departamentos_limite: 1,
    features: JSON.stringify(['fila_visualizar', 'fila_responder', 'notas_criar', 'relatorios_acessar']),
    criado_em: new Date(),
  },
  {
    id: 2,
    nome: 'profissional',
    descricao: 'Plano profissional para equipes',
    preco_mensal: 299.00,
    usuarios_limite: 5,
    mensagens_limite: 10000,
    departamentos_limite: 3,
    features: JSON.stringify([
      'fila_visualizar', 'fila_responder', 'fila_transferir',
      'notas_criar', 'notas_editar', 'historico_visualizar',
      'relatorios_acessar', 'relatorios_exportar',
    ]),
    criado_em: new Date(),
  },
  {
    id: 3,
    nome: 'enterprise',
    descricao: 'Plano enterprise ilimitado',
    preco_mensal: 999.00,
    usuarios_limite: 999999,
    mensagens_limite: 999999,
    departamentos_limite: 999999,
    features: JSON.stringify(['*']),
    criado_em: new Date(),
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('planos', PLANOS, { ignoreDuplicates: true });

    await queryInterface.sequelize.query(
      `SELECT setval(pg_get_serial_sequence('planos', 'id'), (SELECT MAX(id) FROM planos))`
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('planos', { nome: PLANOS.map(p => p.nome) }, {});
  },
};
