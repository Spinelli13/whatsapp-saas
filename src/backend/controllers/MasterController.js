'use strict';

/**
 * MasterController
 *
 * Handles all master (system owner) operations:
 * - Manage clients (CRUD)
 * - Manage plans (CRUD with modules)
 * - View client consumption
 * - Financial dashboard
 * - Manage upgrade requests
 *
 * Master is the system owner (you - sistemasimediatos)
 * Master can see and manage everything across all clients
 */

const {
  Cliente,
  Usuario,
  Plano,
  ClientePlano,
  Modulo,
  PlanosModulos,
  ClienteModulos,
  SolicitacaoUpgrade,
} = require('../models');

const { Op } = require('sequelize');

class MasterController {
  // ═══════════════════════════════════════════════════════════════════════
  // CLIENTES - CRUD
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * criarCliente - Create a new client
   *
   * @example
   * POST /api/master/clientes
   * { "nome": "ACN Sistemas", "email": "admin@acn.com.br", "cnpj": "12.345.678/0001-90", "telefone": "(11) 98765-4321" }
   */
  static async criarCliente(req, res) {
    try {
      const { nome, email, cnpj, telefone, status = 'ativo' } = req.body;

      if (!nome || nome.length < 3) {
        return res.status(400).json({
          erro: 'Nome deve ter pelo menos 3 caracteres',
          campo: 'nome',
        });
      }

      if (!email || !email.includes('@')) {
        return res.status(400).json({
          erro: 'Email inválido',
          campo: 'email',
        });
      }

      const emailExistente = await Cliente.findOne({ where: { email } });
      if (emailExistente) {
        return res.status(409).json({
          erro: 'Email já cadastrado',
          campo: 'email',
        });
      }

      if (cnpj) {
        const cnpjExistente = await Cliente.findOne({ where: { cnpj } });
        if (cnpjExistente) {
          return res.status(409).json({
            erro: 'CNPJ já cadastrado',
            campo: 'cnpj',
          });
        }
      }

      const novoCliente = await Cliente.create({
        nome,
        email,
        cnpj: cnpj || null,
        telefone: telefone || null,
        status,
      });

      return res.status(201).json({
        mensagem: 'Cliente criado com sucesso',
        cliente: novoCliente.toJSON(),
      });
    } catch (erro) {
      console.error('Erro ao criar cliente:', erro);
      return res.status(500).json({
        erro: 'Erro ao criar cliente',
        detalhes: process.env.NODE_ENV === 'development' ? erro.message : undefined,
      });
    }
  }

  /**
   * listarClientes - List all clients with pagination and filters
   *
   * @example
   * GET /api/master/clientes?page=1&limit=10&status=ativo
   */
  static async listarClientes(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
      const offset = (page - 1) * limit;

      const where = {};

      if (req.query.status) {
        where.status = req.query.status;
      }

      if (req.query.search) {
        where[Op.or] = [
          { nome: { [Op.iLike]: `%${req.query.search}%` } },
          { email: { [Op.iLike]: `%${req.query.search}%` } },
        ];
      }

      const { count, rows } = await Cliente.findAndCountAll({
        where,
        include: [
          {
            model: ClientePlano,
            as: 'planos',
            attributes: ['plano_id', 'data_proxima_renovacao'],
            include: [
              {
                model: Plano,
                as: 'Plano',
                attributes: ['nome', 'preco_mensal'],
              },
            ],
          },
        ],
        offset,
        limit,
        order: [['data_criacao', 'DESC']],
      });

      return res.status(200).json({
        total: count,
        pagina: page,
        limite: limit,
        clientes: rows,
      });
    } catch (erro) {
      console.error('Erro ao listar clientes:', erro);
      return res.status(500).json({ erro: 'Erro ao listar clientes' });
    }
  }

  /**
   * atualizarCliente - Update a client
   */
  static async atualizarCliente(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, cnpj, telefone, status } = req.body;

      const cliente = await Cliente.findByPk(id);

      if (!cliente) {
        return res.status(404).json({ erro: 'Cliente não encontrado', id });
      }

      if (email && email !== cliente.email) {
        const emailExistente = await Cliente.findOne({ where: { email } });
        if (emailExistente) {
          return res.status(409).json({
            erro: 'Email já cadastrado',
            campo: 'email',
          });
        }
      }

      if (nome) cliente.nome = nome;
      if (email) cliente.email = email;
      if (cnpj !== undefined) cliente.cnpj = cnpj;
      if (telefone !== undefined) cliente.telefone = telefone;
      if (status) cliente.status = status;

      await cliente.save();

      return res.status(200).json({
        mensagem: 'Cliente atualizado com sucesso',
        cliente: cliente.toJSON(),
      });
    } catch (erro) {
      console.error('Erro ao atualizar cliente:', erro);
      return res.status(500).json({ erro: 'Erro ao atualizar cliente' });
    }
  }

  /**
   * deletarCliente - Delete (soft delete) a client
   */
  static async deletarCliente(req, res) {
    try {
      const { id } = req.params;

      const cliente = await Cliente.findByPk(id);

      if (!cliente) {
        return res.status(404).json({ erro: 'Cliente não encontrado', id });
      }

      cliente.status = 'inativo';
      await cliente.save();

      return res.status(200).json({
        mensagem: 'Cliente deletado com sucesso',
        cliente: cliente.toJSON(),
      });
    } catch (erro) {
      console.error('Erro ao deletar cliente:', erro);
      return res.status(500).json({ erro: 'Erro ao deletar cliente' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONSUMO
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * verConsumoCliente - View client's current consumption
   */
  static async verConsumoCliente(req, res) {
    try {
      const { id } = req.params;

      const cliente = await Cliente.findByPk(id, {
        include: [
          {
            model: ClientePlano,
            as: 'planos',
            include: [
              {
                model: Plano,
                as: 'Plano',
                include: [
                  {
                    model: Modulo,
                    as: 'modulos',
                    through: { attributes: [] },
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!cliente) {
        return res.status(404).json({ erro: 'Cliente não encontrado' });
      }

      // TODO: Buscar consumo do mês em UsoCliente model
      const planoAtivo = cliente.planos?.find((p) => p.status === 'ativo') || cliente.planos?.[0];

      const consumo = {
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          email: cliente.email,
        },
        plano_atual: planoAtivo?.Plano || null,
        modulos_contratados: planoAtivo?.Plano?.modulos || [],
        uso_mensal: {
          mensagens: 0, // TODO: from UsoCliente
          usuarios: 0, // TODO: from UsoCliente
          departamentos: 0,
        },
        percentual_uso: {
          mensagens: 0,
          usuarios: 0,
          departamentos: 0,
        },
      };

      return res.status(200).json(consumo);
    } catch (erro) {
      console.error('Erro ao ver consumo:', erro);
      return res.status(500).json({ erro: 'Erro ao ver consumo' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PLANOS - CRUD
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * criarPlano - Create a new plan
   *
   * @example
   * POST /api/master/planos
   * { "nome": "Pro Plus", "preco_mensal": 999.00, "modulos": [1,2,3,4,5,6,7] }
   */
  static async criarPlano(req, res) {
    try {
      const {
        nome,
        descricao,
        preco_mensal,
        usuarios_limite,
        mensagens_limite,
        departamentos_limite,
        modulos = [],
      } = req.body;

      if (!nome || nome.length < 3) {
        return res.status(400).json({
          erro: 'Nome do plano deve ter pelo menos 3 caracteres',
          campo: 'nome',
        });
      }

      if (!preco_mensal || preco_mensal <= 0) {
        return res.status(400).json({
          erro: 'Preço deve ser maior que 0',
          campo: 'preco_mensal',
        });
      }

      const nomeExistente = await Plano.findOne({ where: { nome } });
      if (nomeExistente) {
        return res.status(409).json({
          erro: 'Plano com este nome já existe',
          campo: 'nome',
        });
      }

      const novoPlano = await Plano.create({
        nome,
        descricao: descricao || null,
        preco_mensal,
        usuarios_limite: usuarios_limite || 5,
        mensagens_limite: mensagens_limite || 1000,
        departamentos_limite: departamentos_limite || 2,
        features: JSON.stringify([]), // Legacy field, não usar mais
      });

      if (modulos && modulos.length > 0) {
        const modulosAssociacao = modulos.map((modulo_id) => ({
          plano_id: novoPlano.id,
          modulo_id,
          data_adicionado: new Date(),
        }));

        await PlanosModulos.bulkCreate(modulosAssociacao);
      }

      const planosModulos = await PlanosModulos.findAll({
        where: { plano_id: novoPlano.id },
        include: [{ model: Modulo, attributes: ['id', 'nome', 'descricao'] }],
      });

      return res.status(201).json({
        mensagem: 'Plano criado com sucesso',
        plano: {
          ...novoPlano.toJSON(),
          modulos: planosModulos.map((pm) => pm.Modulo),
        },
      });
    } catch (erro) {
      console.error('Erro ao criar plano:', erro);
      return res.status(500).json({ erro: 'Erro ao criar plano' });
    }
  }

  /**
   * listarPlanos - List all plans with their modules
   */
  static async listarPlanos(req, res) {
    try {
      const planos = await Plano.findAll({
        include: [
          {
            model: Modulo,
            attributes: ['id', 'nome', 'descricao'],
            through: { attributes: [] },
            as: 'modulos',
          },
        ],
        order: [['preco_mensal', 'ASC']],
      });

      return res.status(200).json({
        total: planos.length,
        planos,
      });
    } catch (erro) {
      console.error('Erro ao listar planos:', erro);
      return res.status(500).json({ erro: 'Erro ao listar planos' });
    }
  }

  /**
   * atualizarPlano - Update a plan and its modules
   */
  static async atualizarPlano(req, res) {
    try {
      const { id } = req.params;
      const {
        nome,
        descricao,
        preco_mensal,
        usuarios_limite,
        mensagens_limite,
        departamentos_limite,
        modulos = [],
      } = req.body;

      const plano = await Plano.findByPk(id);

      if (!plano) {
        return res.status(404).json({ erro: 'Plano não encontrado' });
      }

      if (nome) plano.nome = nome;
      if (descricao !== undefined) plano.descricao = descricao;
      if (preco_mensal) plano.preco_mensal = preco_mensal;
      if (usuarios_limite) plano.usuarios_limite = usuarios_limite;
      if (mensagens_limite) plano.mensagens_limite = mensagens_limite;
      if (departamentos_limite) plano.departamentos_limite = departamentos_limite;

      await plano.save();

      if (modulos.length > 0) {
        await PlanosModulos.destroy({ where: { plano_id: id } });

        const modulosAssociacao = modulos.map((modulo_id) => ({
          plano_id: id,
          modulo_id,
          data_adicionado: new Date(),
        }));

        await PlanosModulos.bulkCreate(modulosAssociacao);
      }

      const planosModulos = await PlanosModulos.findAll({
        where: { plano_id: id },
        include: [{ model: Modulo, attributes: ['id', 'nome', 'descricao'] }],
      });

      return res.status(200).json({
        mensagem: 'Plano atualizado com sucesso',
        plano: {
          ...plano.toJSON(),
          modulos: planosModulos.map((pm) => pm.Modulo),
        },
      });
    } catch (erro) {
      console.error('Erro ao atualizar plano:', erro);
      return res.status(500).json({ erro: 'Erro ao atualizar plano' });
    }
  }

  /**
   * deletarPlano - Delete (soft delete) a plan
   *
   * Validation: cannot delete plan if active clients are using it
   */
  static async deletarPlano(req, res) {
    try {
      const { id } = req.params;

      const plano = await Plano.findByPk(id);

      if (!plano) {
        return res.status(404).json({ erro: 'Plano não encontrado' });
      }

      const clientesUsandoPlano = await ClientePlano.count({
        where: { plano_id: id, status: 'ativo' },
      });

      if (clientesUsandoPlano > 0) {
        return res.status(409).json({
          erro: 'Não é possível deletar plano com clientes ativos',
          clientes_ativos: clientesUsandoPlano,
        });
      }

      plano.status = 'inativo';
      await plano.save();

      return res.status(200).json({ mensagem: 'Plano deletado com sucesso' });
    } catch (erro) {
      console.error('Erro ao deletar plano:', erro);
      return res.status(500).json({ erro: 'Erro ao deletar plano' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ATRIBUIÇÃO DE PLANOS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * atribuirPlanoCliente - Assign a plan to a client
   *
   * Updates or creates ClientePlano record, sets data_proxima_renovacao
   * to +30 days, cancels previous plan if exists, and syncs the client's
   * modules to match the new plan's modules.
   */
  static async atribuirPlanoCliente(req, res) {
    try {
      const { cliente_id, plano_id } = req.body;

      if (!cliente_id || !plano_id) {
        return res.status(400).json({ erro: 'cliente_id e plano_id são obrigatórios' });
      }

      const cliente = await Cliente.findByPk(cliente_id);
      if (!cliente) {
        return res.status(404).json({ erro: 'Cliente não encontrado' });
      }

      const plano = await Plano.findByPk(plano_id);
      if (!plano) {
        return res.status(404).json({ erro: 'Plano não encontrado' });
      }

      await ClientePlano.update(
        { status: 'cancelado' },
        { where: { cliente_id, status: 'ativo' } }
      );

      const dataProximaRenovacao = new Date();
      dataProximaRenovacao.setDate(dataProximaRenovacao.getDate() + 30);

      const [clientePlano, criado] = await ClientePlano.findOrCreate({
        where: { cliente_id, plano_id },
        defaults: {
          status: 'ativo',
          data_proxima_renovacao: dataProximaRenovacao,
          data_inicio: new Date(),
        },
      });

      if (!criado) {
        clientePlano.status = 'ativo';
        clientePlano.data_proxima_renovacao = dataProximaRenovacao;
        await clientePlano.save();
      }

      const modulosPlano = await PlanosModulos.findAll({ where: { plano_id } });

      await ClienteModulos.destroy({ where: { cliente_id } });

      if (modulosPlano.length > 0) {
        const clienteModulos = modulosPlano.map((pm) => ({
          cliente_id,
          modulo_id: pm.modulo_id,
          data_adicionado: new Date(),
        }));

        await ClienteModulos.bulkCreate(clienteModulos);
      }

      return res.status(200).json({
        mensagem: 'Plano atribuído ao cliente com sucesso',
        clientePlano: {
          ...clientePlano.toJSON(),
          plano: plano.toJSON(),
        },
      });
    } catch (erro) {
      console.error('Erro ao atribuir plano:', erro);
      return res.status(500).json({ erro: 'Erro ao atribuir plano' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * dashboardMaster - Financial and operational dashboard
   */
  static async dashboardMaster(req, res) {
    try {
      const totalClientes = await Cliente.count({ where: { status: 'ativo' } });

      const clientesComPlano = await ClientePlano.findAll({
        where: { status: 'ativo' },
        include: [
          { model: Plano, as: 'Plano', attributes: ['id', 'nome', 'preco_mensal'] },
          { model: Cliente, as: 'cliente', attributes: ['id', 'nome'] },
        ],
      });

      let receitaMensal = 0;
      const clientesPorPlano = {};

      clientesComPlano.forEach((cp) => {
        const nomePlano = cp.Plano.nome;
        clientesPorPlano[nomePlano] = (clientesPorPlano[nomePlano] || 0) + 1;
        receitaMensal += Number(cp.Plano.preco_mensal);
      });

      const solicitacoesPendentes = await SolicitacaoUpgrade.count({
        where: { status: 'pendente' },
      });

      const topClientes = clientesComPlano
        .map((cp) => ({
          cliente_id: cp.cliente_id,
          nome: cp.cliente?.nome || 'Unknown',
          plano: cp.Plano.nome,
          receita_mensal: Number(cp.Plano.preco_mensal),
        }))
        .sort((a, b) => b.receita_mensal - a.receita_mensal)
        .slice(0, 5);

      const dashboard = {
        total_clientes: totalClientes,
        total_clientes_ativos: clientesComPlano.length,
        receita_mensal_esperada: receitaMensal,
        receita_anual_esperada: receitaMensal * 12,
        clientes_por_plano: clientesPorPlano,
        uso_medio_mensagens: 0, // TODO: from UsoCliente
        uso_medio_usuarios: 0,
        solicitacoes_pendentes: solicitacoesPendentes,
        top_clientes: topClientes,
      };

      return res.status(200).json(dashboard);
    } catch (erro) {
      console.error('Erro ao gerar dashboard:', erro);
      return res.status(500).json({ erro: 'Erro ao gerar dashboard' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SOLICITAÇÕES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * listarSolicitacoes - List upgrade requests with filters
   */
  static async listarSolicitacoes(req, res) {
    try {
      const where = {};

      if (req.query.status) {
        where.status = req.query.status;
      }

      if (req.query.tipo) {
        where.tipo = req.query.tipo;
      }

      const solicitacoes = await SolicitacaoUpgrade.findAll({
        where,
        include: [
          { model: Cliente, attributes: ['id', 'nome', 'email'], as: 'cliente' },
          { model: Usuario, attributes: ['id', 'nome', 'email'], as: 'admin' },
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

  /**
   * aprovarSolicitacao - Approve an upgrade request
   *
   * If tipo = 'plano': assign plan to client
   * If tipo = 'modulo': add module to client
   */
  static async aprovarSolicitacao(req, res) {
    try {
      const { id } = req.params;

      const solicitacao = await SolicitacaoUpgrade.findByPk(id, {
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Plano, as: 'plano' },
          { model: Modulo, as: 'modulo' },
        ],
      });

      if (!solicitacao) {
        return res.status(404).json({ erro: 'Solicitação não encontrada' });
      }

      if (solicitacao.status !== 'pendente') {
        return res.status(409).json({ erro: 'Solicitação já foi processada' });
      }

      if (solicitacao.tipo === 'plano') {
        await ClientePlano.update(
          { status: 'cancelado' },
          { where: { cliente_id: solicitacao.cliente_id, status: 'ativo' } }
        );

        const dataProximaRenovacao = new Date();
        dataProximaRenovacao.setDate(dataProximaRenovacao.getDate() + 30);

        await ClientePlano.create({
          cliente_id: solicitacao.cliente_id,
          plano_id: solicitacao.plano_id,
          status: 'ativo',
          data_proxima_renovacao: dataProximaRenovacao,
          data_inicio: new Date(),
        });

        const modulosPlano = await PlanosModulos.findAll({
          where: { plano_id: solicitacao.plano_id },
        });

        await ClienteModulos.destroy({ where: { cliente_id: solicitacao.cliente_id } });

        if (modulosPlano.length > 0) {
          const clienteModulos = modulosPlano.map((pm) => ({
            cliente_id: solicitacao.cliente_id,
            modulo_id: pm.modulo_id,
            data_adicionado: new Date(),
          }));

          await ClienteModulos.bulkCreate(clienteModulos);
        }
      } else if (solicitacao.tipo === 'modulo') {
        const [, criado] = await ClienteModulos.findOrCreate({
          where: {
            cliente_id: solicitacao.cliente_id,
            modulo_id: solicitacao.modulo_id,
          },
          defaults: { data_adicionado: new Date() },
        });

        if (!criado) {
          return res.status(409).json({ erro: 'Cliente já tem acesso a este módulo' });
        }
      }

      solicitacao.status = 'aprovado';
      solicitacao.data_aprovacao = new Date();
      await solicitacao.save();

      return res.status(200).json({
        mensagem: 'Solicitação aprovada com sucesso',
        solicitacao: solicitacao.toJSON(),
      });
    } catch (erro) {
      console.error('Erro ao aprovar solicitação:', erro);
      return res.status(500).json({ erro: 'Erro ao aprovar solicitação' });
    }
  }

  /**
   * recusarSolicitacao - Reject an upgrade request with reason
   */
  static async recusarSolicitacao(req, res) {
    try {
      const { id } = req.params;
      const { motivo_recusa } = req.body;

      if (!motivo_recusa || motivo_recusa.length < 5) {
        return res.status(400).json({
          erro: 'Motivo da recusa deve ter pelo menos 5 caracteres',
          campo: 'motivo_recusa',
        });
      }

      const solicitacao = await SolicitacaoUpgrade.findByPk(id);

      if (!solicitacao) {
        return res.status(404).json({ erro: 'Solicitação não encontrada' });
      }

      if (solicitacao.status !== 'pendente') {
        return res.status(409).json({ erro: 'Solicitação já foi processada' });
      }

      solicitacao.status = 'recusado';
      solicitacao.motivo_recusa = motivo_recusa;
      solicitacao.data_aprovacao = new Date();
      await solicitacao.save();

      return res.status(200).json({
        mensagem: 'Solicitação recusada com sucesso',
        solicitacao: solicitacao.toJSON(),
      });
    } catch (erro) {
      console.error('Erro ao recusar solicitação:', erro);
      return res.status(500).json({ erro: 'Erro ao recusar solicitação' });
    }
  }
}

module.exports = MasterController;
