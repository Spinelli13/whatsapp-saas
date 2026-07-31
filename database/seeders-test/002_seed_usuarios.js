'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const senhaHash = await bcrypt.hash('password123', 10);
    const now = new Date();

    await queryInterface.bulkInsert(
      'usuarios',
      [
        // Cliente 1
        { id: 1, cliente_id: 1, email: 'admin@cliente1.com',     senha: senhaHash, nome: 'João Silva',    role: 'admin',     status: 'ativo', data_criacao: now, data_atualizacao: now },
        { id: 2, cliente_id: 1, email: 'ana@cliente1.com',       senha: senhaHash, nome: 'Ana Costa',     role: 'atendente', status: 'ativo', data_criacao: now, data_atualizacao: now },
        { id: 3, cliente_id: 1, email: 'bruno@cliente1.com',     senha: senhaHash, nome: 'Bruno Santos',  role: 'atendente', status: 'ativo', data_criacao: now, data_atualizacao: now },
        // Cliente 2
        { id: 4, cliente_id: 2, email: 'admin@barcos.com',       senha: senhaHash, nome: 'Maria Gomes',   role: 'admin',     status: 'ativo', data_criacao: now, data_atualizacao: now },
        { id: 5, cliente_id: 2, email: 'carlos@barcos.com',      senha: senhaHash, nome: 'Carlos Dias',   role: 'atendente', status: 'ativo', data_criacao: now, data_atualizacao: now },
      ],
      { ignoreDuplicates: true }
    );

    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('usuarios', 'id'), (SELECT MAX(id) FROM usuarios))"
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', { id: [1, 2, 3, 4, 5] }, {});
  },
};
