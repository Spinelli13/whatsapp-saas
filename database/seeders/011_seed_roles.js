'use strict';

// Roles padrão por cliente (4 roles × 2 clientes = 8 roles)
// IDs explícitos para que os testes possam fazer referência:
//   C1: admin=1, supervisor=2, atendente=3, visualizador=4
//   C2: admin=5, supervisor=6, atendente=7, visualizador=8

const ROLES = [
  { id: 1, cliente_id: 1, nome: 'admin',        descricao: 'Administrador — Acesso total',         eh_customizado: false },
  { id: 2, cliente_id: 1, nome: 'supervisor',   descricao: 'Supervisor — Gerencia equipe',         eh_customizado: false },
  { id: 3, cliente_id: 1, nome: 'atendente',    descricao: 'Atendente — Responde tickets',         eh_customizado: false },
  { id: 4, cliente_id: 1, nome: 'visualizador', descricao: 'Visualizador — Lê sem agir',           eh_customizado: false },
  { id: 5, cliente_id: 2, nome: 'admin',        descricao: 'Administrador — Acesso total',         eh_customizado: false },
  { id: 6, cliente_id: 2, nome: 'supervisor',   descricao: 'Supervisor — Gerencia equipe',         eh_customizado: false },
  { id: 7, cliente_id: 2, nome: 'atendente',    descricao: 'Atendente — Responde tickets',         eh_customizado: false },
  { id: 8, cliente_id: 2, nome: 'visualizador', descricao: 'Visualizador — Lê sem agir',           eh_customizado: false },
].map(r => ({ ...r, criado_em: new Date() }));

// Permissões por role (usando IDs definidos no seeder 010)
// fila: 1-6 | notas: 7-11 | usuarios: 12-15 | relatorios: 16-17 | configuracoes: 18-23
const ROLE_PERMISSOES = {
  admin:        [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],
  supervisor:   [1,2,3,4,7,10,11,12,13,15,16,17,20,21],
  atendente:    [1,2,4,7,8,11,16],
  visualizador: [1,11,16],
};

module.exports = {
  async up(queryInterface) {
    // Inserir roles
    await queryInterface.bulkInsert('roles', ROLES, { ignoreDuplicates: true });

    // Reset sequence
    await queryInterface.sequelize.query(
      `SELECT setval(pg_get_serial_sequence('roles', 'id'), (SELECT MAX(id) FROM roles))`
    );

    // Obter IDs de permissões por nome
    const permRows = await queryInterface.sequelize.query(
      `SELECT id, nome FROM permissoes ORDER BY id`,
      { type: 'SELECT' }
    );
    const permByName = {};
    permRows.forEach(p => { permByName[p.nome] = p.id; });

    // Obter roles do DB para confirmar IDs
    const roleRows = await queryInterface.sequelize.query(
      `SELECT id, nome, cliente_id FROM roles ORDER BY id`,
      { type: 'SELECT' }
    );

    const pairs = [];
    const now = new Date();

    for (const role of roleRows) {
      const permNames = ROLE_PERMISSOES[role.nome] || [];
      const permIds = typeof permNames[0] === 'number'
        ? permNames  // já são IDs
        : permNames.map(n => permByName[n]).filter(Boolean);

      for (const permId of permIds) {
        pairs.push({ role_id: role.id, permissao_id: permId, criado_em: now });
      }
    }

    if (pairs.length > 0) {
      await queryInterface.bulkInsert('role_permissoes', pairs, { ignoreDuplicates: true });
    }

    // Atribuir role_id a usuários existentes com base no campo role (string)
    await queryInterface.sequelize.query(`
      UPDATE usuarios u
      SET role_id = r.id
      FROM roles r
      WHERE r.cliente_id = u.cliente_id
        AND r.nome = u.role
        AND u.role_id IS NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`UPDATE usuarios SET role_id = NULL`);
    await queryInterface.bulkDelete('role_permissoes', null, {});
    await queryInterface.bulkDelete('roles', { id: ROLES.map(r => r.id) }, {});
  },
};
