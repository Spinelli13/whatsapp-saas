'use strict';

const PERMISSOES = [
  // fila
  { id: 1,  nome: 'fila.visualizar',              categoria: 'fila',           descricao: 'Ver fila de mensagens' },
  { id: 2,  nome: 'fila.responder',               categoria: 'fila',           descricao: 'Responder mensagens' },
  { id: 3,  nome: 'fila.transferir',              categoria: 'fila',           descricao: 'Transferir para outro agente/departamento' },
  { id: 4,  nome: 'fila.fechar',                  categoria: 'fila',           descricao: 'Fechar ticket' },
  { id: 5,  nome: 'fila.reabrir',                 categoria: 'fila',           descricao: 'Reabrir ticket fechado' },
  { id: 6,  nome: 'fila.deletar',                 categoria: 'fila',           descricao: 'Deletar ticket (admin)' },
  // notas
  { id: 7,  nome: 'notas.criar',                  categoria: 'notas',          descricao: 'Adicionar notas em ticket' },
  { id: 8,  nome: 'notas.editar',                 categoria: 'notas',          descricao: 'Editar notas próprias' },
  { id: 9,  nome: 'notas.deletar',                categoria: 'notas',          descricao: 'Deletar notas (próprias ou admin)' },
  { id: 10, nome: 'notas.ver_privadas',           categoria: 'notas',          descricao: 'Ver notas privadas (admin/supervisor)' },
  { id: 11, nome: 'historico.visualizar',         categoria: 'notas',          descricao: 'Ver histórico completo' },
  // usuarios
  { id: 12, nome: 'usuarios.criar',               categoria: 'usuarios',       descricao: 'Criar novo usuário' },
  { id: 13, nome: 'usuarios.editar',              categoria: 'usuarios',       descricao: 'Editar usuários' },
  { id: 14, nome: 'usuarios.deletar',             categoria: 'usuarios',       descricao: 'Deletar usuários' },
  { id: 15, nome: 'usuarios.gerenciar_roles',     categoria: 'usuarios',       descricao: 'Atribuir roles a usuários' },
  // relatorios
  { id: 16, nome: 'relatorios.acessar',           categoria: 'relatorios',     descricao: 'Ver relatórios' },
  { id: 17, nome: 'relatorios.exportar',          categoria: 'relatorios',     descricao: 'Exportar dados (CSV, PDF)' },
  // configuracoes
  { id: 18, nome: 'configuracoes.acessar',        categoria: 'configuracoes',  descricao: 'Acessar painel de configurações' },
  { id: 19, nome: 'configuracoes.plano',          categoria: 'configuracoes',  descricao: 'Gerenciar plano do cliente' },
  { id: 20, nome: 'configuracoes.departamentos',  categoria: 'configuracoes',  descricao: 'Gerenciar departamentos' },
  { id: 21, nome: 'configuracoes.automacoes',     categoria: 'configuracoes',  descricao: 'Criar/editar automações' },
  { id: 22, nome: 'configuracoes.templates',      categoria: 'configuracoes',  descricao: 'Gerenciar templates' },
  { id: 23, nome: 'configuracoes.permissoes',     categoria: 'configuracoes',  descricao: 'Gerenciar roles e permissões' },
].map(p => ({ ...p, criado_em: new Date() }));

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('permissoes', PERMISSOES, { ignoreDuplicates: true });

    // Reset sequence after explicit IDs
    await queryInterface.sequelize.query(
      `SELECT setval(pg_get_serial_sequence('permissoes', 'id'), (SELECT MAX(id) FROM permissoes))`
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('permissoes', { nome: PERMISSOES.map(p => p.nome) }, {});
  },
};
