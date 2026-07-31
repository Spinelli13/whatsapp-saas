'use strict';

/**
 * AdminController
 *
 * Handles all admin (client manager) operations:
 * - View client dashboard
 * - Manage team members (attendants)
 * - Define per-module permissions per team member
 * - Request upgrades (new plan or module)
 * - View contracted modules
 *
 * Admin is scoped to their client only (req.usuario.cliente_id).
 * Cannot access data from other clients.
 */

const {
  Cliente,
  Usuario,
  Plano,
  ClientePlano,
  Modulo,
  ClienteModulos,
  PermissaoModulo,
  SolicitacaoUpgrade,
} = require('../models');

const bcrypt = require('bcryptjs');

class AdminController {
  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * dashboardAdmin - View client dashboard with consumption
   */
  static async dashboardAdmin(req, res) {
    try {
      const cliente_id = req.usuario.cliente_id;

      const cliente = await Cliente.findByPk(cliente_id, {
        attributes: ['id', 'nome', 'email', 'cnpj', 'status'],
      });

      if (!cliente) {
        return res.status(404).json({ erro: 'Cliente não encontrado' });
      }

      const clientePlano = await ClientePlano.findOne({
        where: { cliente_id, status: 'ativo' },
        include: [
          {
            model: Plano,
            as: 'Plano',
            attributes: [
              'id',
              'nome',
              'preco_mensal',
              'usuarios_limite',
              'mensagens_limite',
              'departamentos_limite',
            ],
          },
        ],
      });

      const modulosContratados = await ClienteModulos.findAll({
        where: { cliente_id },
        include: [{ model: Modulo, attributes: ['id', 'nome', 'descricao'] }],
      });

      const atendentesCount = await Usuario.count({
        where: { cliente_id, role: 'atendente', status: 'ativo' },
      });

      // TODO: Buscar uso_mensal de UsoCliente model
      const usoMensal = { mensagens: 0, usuarios: 0, departamentos: 0 };
      const percentualUso = { mensagens: 0, usuarios: 0, departamentos: 0 };

      const dashboard = {
        cliente: cliente.toJSON(),
        plano_atual: clientePlano?.Plano?.toJSON() || null,
        data_proxima_renovacao: clientePlano?.data_proxima_renovacao || null,
        modulos_contratados: modulosContratados.map((m) => m.Modulo),
        atendentes_count: atendentesCount,
        uso_mensal: usoMensal,
        percentual_uso: percentualUso,
      };

      return res.status(200).json(dashboard);
    } catch (erro) {
      console.error('Erro ao gerar dashboard:', erro);
      return res.status(500).json({ erro: 'Erro ao gerar dashboard' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MÓDULOS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * listarModulosContratados - List modules the client can access
   */
  static async listarModulosContratados(req, res) {
    try {
      const cliente_id = req.usuario.cliente_id;

      const modulos = await ClienteModulos.findAll({
        where: { cliente_id },
        include: [{ model: Modulo, attributes: ['id', 'nome', 'descricao'] }],
      });

      return res.status(200).json({
        total: modulos.length,
        modulos: modulos.map((m) => m.Modulo),
      });
    } catch (erro) {
      console.error('Erro ao listar módulos:', erro);
      return res.status(500).json({ erro: 'Erro ao listar módulos' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SOLICITAÇÕES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * solicitarNovoPlano - Request upgrade to a new plan
   */
  static async solicitarNovoPlano(req, res) {
    try {
      const cliente_id = req.usuario.cliente_id;
      const { plano_id } = req.body;

      if (!plano_id) {
        return res.status(400).json({ erro: 'plano_id é obrigatório', campo: 'plano_id' });
      }

      const plano = await Plano.findByPk(plano_id);
      if (!plano) {
        return res.status(404).json({ erro: 'Plano não encontrado' });
      }

      const planoAtual = await ClientePlano.findOne({
        where: { cliente_id, status: 'ativo' },
      });

      if (planoAtual && planoAtual.plano_id === plano_id) {
        return res.status(409).json({ erro: 'Você já está neste plano' });
      }

      const solicitacao = await SolicitacaoUpgrade.create({
        cliente_id,
        admin_id: req.usuario.id,
        tipo: 'plano',
        plano_id,
        modulo_id: null,
        status: 'pendente',
      });

      return res.status(201).json({
        mensagem: 'Solicitação de plano criada com sucesso',
        solicitacao: solicitacao.toJSON(),
      });
    } catch (erro) {
      console.error('Erro ao solicitar plano:', erro);
      return res.status(500).json({ erro: 'Erro ao solicitar plano' });
    }
  }

  /**
   * solicitarNovoModulo - Request addition of a new module
   */
  static async solicitarNovoModulo(req, res) {
    try {
      const cliente_id = req.usuario.cliente_id;
      const { modulo_id } = req.body;

      if (!modulo_id) {
        return res.status(400).json({ erro: 'modulo_id é obrigatório', campo: 'modulo_id' });
      }

      const modulo = await Modulo.findByPk(modulo_id);
      if (!modulo) {
        return res.status(404).json({ erro: 'Módulo não encontrado' });
      }

      const jaTemAcesso = await ClienteModulos.findOne({ where: { cliente_id, modulo_id } });

      if (jaTemAcesso) {
        return res.status(409).json({ erro: 'Você já tem acesso a este módulo' });
      }

      const solicitacao = await SolicitacaoUpgrade.create({
        cliente_id,
        admin_id: req.usuario.id,
        tipo: 'modulo',
        plano_id: null,
        modulo_id,
        status: 'pendente',
      });

      return res.status(201).json({
        mensagem: 'Solicitação de módulo criada com sucesso',
        solicitacao: solicitacao.toJSON(),
      });
    } catch (erro) {
      console.error('Erro ao solicitar módulo:', erro);
      return res.status(500).json({ erro: 'Erro ao solicitar módulo' });
    }
  }

  /**
   * listarMinhasSolicitacoes - List my client's requests
   */
  static async listarMinhasSolicitacoes(req, res) {
    try {
      const cliente_id = req.usuario.cliente_id;
      const { status } = req.query;

      const where = { cliente_id };
      if (status) {
        where.status = status;
      }

      const solicitacoes = await SolicitacaoUpgrade.findAll({
        where,
        include: [
          { model: Plano, attributes: ['id', 'nome', 'preco_mensal'], as: 'plano' },
          { model: Modulo, attributes: ['id', 'nome', 'descricao'], as: 'modulo' },
        ],
        order: [['data_solicitacao', 'DESC']],
      });

      return res.status(200).json({
        total: solicitacoes.length,
        solicitacoes,
      });
    } catch (erro) {
      console.error('Erro ao listar solicitações:', erro);
      return res.status(500).json({ erro: 'Erro ao listar solicitações' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ATENDENTES - CRUD
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * criarAtendente - Create a new team member
   */
  static async criarAtendente(req, res) {
    try {
      const cliente_id = req.usuario.cliente_id;
      const { nome, email, senha, modulos = [], status = 'ativo' } = req.body;

      if (!nome || nome.length < 3) {
        return res.status(400).json({
          erro: 'Nome deve ter pelo menos 3 caracteres',
          campo: 'nome',
        });
      }

      if (!email || !email.includes('@')) {
        return res.status(400).json({ erro: 'Email inválido', campo: 'email' });
      }

      if (!senha || senha.length < 8) {
        return res.status(400).json({
          erro: 'Senha deve ter pelo menos 8 caracteres',
          campo: 'senha',
        });
      }

      const emailExistente = await Usuario.findOne({ where: { email, cliente_id } });

      if (emailExistente) {
        return res.status(409).json({
          erro: 'Email já cadastrado neste cliente',
          campo: 'email',
        });
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      const novoAtendente = await Usuario.create({
        nome,
        email,
        senha: senhaHash,
        cliente_id,
        role: 'atendente',
        status,
        data_criacao: new Date(),
      });

      if (modulos && modulos.length > 0) {
        const permissoes = modulos.map((modulo_id) => ({
          usuario_id: novoAtendente.id,
          modulo_id,
          ativado: true,
        }));

        await PermissaoModulo.bulkCreate(permissoes);
      }

      const atendente = novoAtendente.toJSON();
      delete atendente.senha;

      return res.status(201).json({
        mensagem: 'Atendente criado com sucesso',
        atendente,
      });
    } catch (erro) {
      console.error('Erro ao criar atendente:', erro);
      return res.status(500).json({ erro: 'Erro ao criar atendente' });
    }
  }

  /**
   * listarAtendentes - List all team members
   */
  static async listarAtendentes(req, res) {
    try {
      const cliente_id = req.usuario.cliente_id;

      const atendentes = await Usuario.findAll({
        where: { cliente_id, role: 'atendente' },
        attributes: { exclude: ['senha'] },
        include: [
          {
            model: PermissaoModulo,
            as: 'permissoesModulo',
            attributes: ['id', 'modulo_id', 'ativado'],
            include: [{ model: Modulo, attributes: ['id', 'nome', 'descricao'] }],
          },
        ],
      });

      return res.status(200).json({
        total: atendentes.length,
        atendentes,
      });
    } catch (erro) {
      console.error('Erro ao listar atendentes:', erro);
      return res.status(500).json({ erro: 'Erro ao listar atendentes' });
    }
  }

  /**
   * atualizarAtendente - Update a team member
   *
   * Can update: nome, email (if unique in client), status, modulos
   * Cannot change role or cliente_id
   */
  static async atualizarAtendente(req, res) {
    try {
      const cliente_id = req.usuario.cliente_id;
      const { id } = req.params;
      const { nome, email, status, modulos = [] } = req.body;

      const atendente = await Usuario.findOne({
        where: { id, cliente_id, role: 'atendente' },
      });

      if (!atendente) {
        return res.status(404).json({ erro: 'Atendente não encontrado' });
      }

      if (email && email !== atendente.email) {
        const emailExistente = await Usuario.findOne({ where: { email, cliente_id } });

        if (emailExistente) {
          return res.status(409).json({
            erro: 'Email já cadastrado neste cliente',
            campo: 'email',
          });
        }
      }

      if (nome) atendente.nome = nome;
      if (email) atendente.email = email;
      if (status) atendente.status = status;

      await atendente.save();

      if (modulos.length > 0) {
        await PermissaoModulo.destroy({ where: { usuario_id: id } });

        const novasPermissoes = modulos.map((modulo_id) => ({
          usuario_id: id,
          modulo_id,
          ativado: true,
        }));

        await PermissaoModulo.bulkCreate(novasPermissoes);
      }

      const atendenteAtualizado = atendente.toJSON();
      delete atendenteAtualizado.senha;

      return res.status(200).json({
        mensagem: 'Atendente atualizado com sucesso',
        atendente: atendenteAtualizado,
      });
    } catch (erro) {
      console.error('Erro ao atualizar atendente:', erro);
      return res.status(500).json({ erro: 'Erro ao atualizar atendente' });
    }
  }

  /**
   * deletarAtendente - Delete (soft delete) a team member
   */
  static async deletarAtendente(req, res) {
    try {
      const cliente_id = req.usuario.cliente_id;
      const { id } = req.params;

      const atendente = await Usuario.findOne({
        where: { id, cliente_id, role: 'atendente' },
      });

      if (!atendente) {
        return res.status(404).json({ erro: 'Atendente não encontrado' });
      }

      atendente.status = 'inativo';
      await atendente.save();

      return res.status(200).json({ mensagem: 'Atendente deletado com sucesso' });
    } catch (erro) {
      console.error('Erro ao deletar atendente:', erro);
      return res.status(500).json({ erro: 'Erro ao deletar atendente' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PERMISSÕES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * definirPermissoesAtendente - Set module permissions for a team member
   */
  static async definirPermissoesAtendente(req, res) {
    try {
      const cliente_id = req.usuario.cliente_id;
      const { id } = req.params;
      const { modulos = [] } = req.body;

      const atendente = await Usuario.findOne({
        where: { id, cliente_id, role: 'atendente' },
      });

      if (!atendente) {
        return res.status(404).json({ erro: 'Atendente não encontrado' });
      }

      await PermissaoModulo.destroy({ where: { usuario_id: id } });

      if (modulos.length > 0) {
        const novasPermissoes = modulos.map((modulo_id) => ({
          usuario_id: id,
          modulo_id,
          ativado: true,
        }));

        await PermissaoModulo.bulkCreate(novasPermissoes);
      }

      return res.status(200).json({
        mensagem: 'Permissões atualizadas com sucesso',
        modulos_concedidos: modulos.length,
      });
    } catch (erro) {
      console.error('Erro ao definir permissões:', erro);
      return res.status(500).json({ erro: 'Erro ao definir permissões' });
    }
  }

  /**
   * obterPermissoesAtendente - Get module permissions for a team member
   */
  static async obterPermissoesAtendente(req, res) {
    try {
      const cliente_id = req.usuario.cliente_id;
      const { id } = req.params;

      const atendente = await Usuario.findOne({
        where: { id, cliente_id, role: 'atendente' },
      });

      if (!atendente) {
        return res.status(404).json({ erro: 'Atendente não encontrado' });
      }

      const permissoes = await PermissaoModulo.findAll({
        where: { usuario_id: id },
        include: [{ model: Modulo, attributes: ['id', 'nome', 'descricao'] }],
      });

      return res.status(200).json({
        usuario_id: id,
        nome: atendente.nome,
        total_modulos: permissoes.length,
        modulos: permissoes.map((p) => ({
          id: p.Modulo.id,
          nome: p.Modulo.nome,
          descricao: p.Modulo.descricao,
          ativado: p.ativado,
        })),
      });
    } catch (erro) {
      console.error('Erro ao obter permissões:', erro);
      return res.status(500).json({ erro: 'Erro ao obter permissões' });
    }
  }
}

module.exports = AdminController;
