'use strict';

const { Role, Permissao, Usuario } = require('../models');

const RoleService = {
  async listarRoles(cliente_id) {
    return Role.findAll({
      where: { cliente_id },
      include: [{ model: Permissao, as: 'Permissaos', attributes: ['id', 'nome', 'categoria', 'descricao'] }],
      order: [['id', 'ASC']],
    });
  },

  async buscarRole(role_id, cliente_id) {
    return Role.findOne({
      where: { id: role_id, cliente_id },
      include: [{ model: Permissao, as: 'Permissaos', attributes: ['id', 'nome', 'categoria', 'descricao'] }],
    });
  },

  async criarRole(cliente_id, { nome, descricao, eh_customizado = true }) {
    return Role.create({ cliente_id, nome, descricao, eh_customizado });
  },

  async adicionarPermissao(role_id, permissao_id, cliente_id) {
    const role = await Role.findOne({ where: { id: role_id, cliente_id } });
    if (!role) throw new Error('Role não encontrada');

    const permissao = await Permissao.findByPk(permissao_id);
    if (!permissao) throw new Error('Permissão não encontrada');

    await role.addPermissaos([permissao]);
    return role;
  },

  async removerPermissao(role_id, permissao_id, cliente_id) {
    const role = await Role.findOne({ where: { id: role_id, cliente_id } });
    if (!role) throw new Error('Role não encontrada');

    const permissao = await Permissao.findByPk(permissao_id);
    if (!permissao) throw new Error('Permissão não encontrada');

    await role.removePermissaos([permissao]);
    return role;
  },

  async listarPermissoesPorCategoria() {
    const permissoes = await Permissao.findAll({ order: [['categoria', 'ASC'], ['id', 'ASC']] });
    const por_categoria = {};
    permissoes.forEach(p => {
      if (!por_categoria[p.categoria]) por_categoria[p.categoria] = [];
      por_categoria[p.categoria].push(p);
    });
    return por_categoria;
  },

  async atribuirRoleAUsuario(usuario_id, role_id, cliente_id) {
    const role = await Role.findOne({ where: { id: role_id, cliente_id } });
    if (!role) throw new Error('Role não encontrada');

    const usuario = await Usuario.findOne({ where: { id: usuario_id, cliente_id } });
    if (!usuario) throw new Error('Usuário não encontrado');

    await usuario.update({ role_id });
    return usuario;
  },
};

module.exports = RoleService;
