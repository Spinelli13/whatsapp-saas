'use strict';
const { sequelize, Usuario, FilaMensagem, ConfiguracaoRoteamento, SkillAtendente, Departamento, AtendenteDepartamento } = require('../models');
const { Op } = require('sequelize');

class RoteamentoService {
  static async rotearMensagem(clienteId, departamentoId, skillRequerida = null) {
    const config = await ConfiguracaoRoteamento.findOne({
      where: { cliente_id: clienteId, departamento_id: departamentoId, ativo: true },
    });

    if (!config) {
      return this.rotearLeastBusy(clienteId, departamentoId, skillRequerida);
    }

    if (config.tipo_roteamento === 'round_robin') {
      return this.rotearRoundRobin(clienteId, departamentoId, skillRequerida);
    } else if (config.tipo_roteamento === 'skill') {
      return this.rotearPorSkill(clienteId, skillRequerida, config.limite_simultaneos);
    } else {
      return this.rotearLeastBusy(clienteId, departamentoId, skillRequerida);
    }
  }

  static async rotearRoundRobin(clienteId, departamentoId, skillRequerida) {
    const atendentes = await this.obterAtendentesDisponiveis(clienteId, departamentoId, skillRequerida);
    if (!atendentes.length) return null;

    const ultimoAtendimento = await FilaMensagem.findOne({
      where: { cliente_id: clienteId, ...(departamentoId ? { departamento_id: departamentoId } : {}) },
      attributes: ['atendente_id'],
      order: [['criado_em', 'DESC']],
    });

    const ultimoId = ultimoAtendimento?.atendente_id;
    const indiceUltimo = atendentes.findIndex((a) => a.id === ultimoId);
    const proximoIndice = (indiceUltimo + 1) % atendentes.length;

    return atendentes[proximoIndice];
  }

  static async rotearLeastBusy(clienteId, departamentoId, skillRequerida) {
    const atendentes = await this.obterAtendentesDisponiveis(clienteId, departamentoId, skillRequerida);
    if (!atendentes.length) return null;

    const whereConversas = { cliente_id: clienteId, status: 'ativo' };
    if (departamentoId) whereConversas.departamento_id = departamentoId;

    const conversasPorAtendente = await FilaMensagem.findAll({
      where: whereConversas,
      attributes: ['atendente_id', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      group: ['atendente_id'],
      raw: true,
    });

    const mapa = {};
    conversasPorAtendente.forEach((r) => {
      mapa[r.atendente_id] = parseInt(r.total, 10);
    });

    let menorCarga = Infinity;
    let atendenteMenorCarga = atendentes[0];

    atendentes.forEach((a) => {
      const carga = mapa[a.id] || 0;
      if (carga < menorCarga) {
        menorCarga = carga;
        atendenteMenorCarga = a;
      }
    });

    return atendenteMenorCarga;
  }

  static async rotearPorSkill(clienteId, skillRequerida, limiteSimultaneos) {
    if (!skillRequerida) {
      return this.rotearLeastBusy(clienteId, null, null);
    }

    const atendentesComSkill = await SkillAtendente.findAll({
      where: { cliente_id: clienteId, nome_skill: skillRequerida, ativo: true },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'status_atendente'] }],
    });

    const atendentesOnline = atendentesComSkill.filter(
      (a) => a.usuario?.status_atendente === 'online'
    );

    if (!atendentesOnline.length) return null;

    return this.rotearLeastBusy(clienteId, null, skillRequerida);
  }

  static async obterAtendentesDisponiveis(clienteId, departamentoId, skillRequerida = null) {
    const include = [
      {
        model: AtendenteDepartamento,
        as: 'departamentosAtribuidos',
        ...(departamentoId ? { where: { departamento_id: departamentoId } } : {}),
        required: !!departamentoId,
      },
    ];

    if (skillRequerida) {
      include.push({
        model: SkillAtendente,
        as: 'skills',
        where: { nome_skill: skillRequerida, ativo: true },
        required: true,
      });
    }

    return Usuario.findAll({
      where: { cliente_id: clienteId, status_atendente: 'online' },
      include,
      attributes: ['id', 'nome', 'email', 'status_atendente'],
    });
  }

  static async validarSLA(atendimentoId, tempoSLAMinutos) {
    const atendimento = await FilaMensagem.findByPk(atendimentoId);
    if (!atendimento) {
      const err = new Error('Atendimento não encontrado');
      err.status = 404;
      throw err;
    }

    const agora = new Date();
    const diferenca = (agora - atendimento.criado_em) / 1000 / 60;

    return {
      slaExcedido: diferenca > tempoSLAMinutos,
      minutosAteEstourar: Math.max(0, tempoSLAMinutos - diferenca),
      minutosPassados: diferenca,
    };
  }

  static async verificarTransbordo(clienteId, departamentoId, limiteSimultaneos) {
    const atendimentosAtivos = await FilaMensagem.count({
      where: { cliente_id: clienteId, departamento_id: departamentoId, status: 'ativo' },
    });

    if (atendimentosAtivos < limiteSimultaneos) return null;

    const departamentos = await Departamento.findAll({
      where: { cliente_id: clienteId, ativo: true },
      attributes: ['id', 'nome'],
    });

    let deptMenorCarga = null;
    let menorCarga = Infinity;

    for (const dept of departamentos) {
      if (dept.id === departamentoId) continue;
      const carga = await FilaMensagem.count({
        where: { cliente_id: clienteId, departamento_id: dept.id, status: 'ativo' },
      });
      if (carga < menorCarga) {
        menorCarga = carga;
        deptMenorCarga = dept;
      }
    }

    return deptMenorCarga;
  }

  // ── CRUD Configuração ────────────────────────────────────────────────────────

  static async listar(clienteId) {
    return ConfiguracaoRoteamento.findAll({ where: { cliente_id: clienteId } });
  }

  static async obter(clienteId, id) {
    const config = await ConfiguracaoRoteamento.findOne({ where: { id, cliente_id: clienteId } });
    if (!config) {
      const err = new Error('Configuração não encontrada');
      err.status = 404;
      throw err;
    }
    return config;
  }

  static async criar(clienteId, dados) {
    return ConfiguracaoRoteamento.create({ cliente_id: clienteId, ...dados });
  }

  static async atualizar(clienteId, id, dados) {
    const config = await this.obter(clienteId, id);
    return config.update(dados);
  }

  // ── CRUD Skills ──────────────────────────────────────────────────────────────

  static async criarSkill(usuarioId, clienteId, nomeSkill, nivel = 'basico') {
    if (!nomeSkill?.trim()) {
      const err = new Error('Nome da skill obrigatório');
      err.status = 400;
      throw err;
    }
    return SkillAtendente.create({ usuario_id: usuarioId, cliente_id: clienteId, nome_skill: nomeSkill.trim(), nivel });
  }

  static async listarSkillsAtendente(usuarioId, clienteId) {
    return SkillAtendente.findAll({ where: { usuario_id: usuarioId, cliente_id: clienteId, ativo: true } });
  }

  static async deletarSkill(skillId, usuarioId) {
    const skill = await SkillAtendente.findByPk(skillId);
    if (!skill) {
      const err = new Error('Skill não encontrada');
      err.status = 404;
      throw err;
    }
    if (skill.usuario_id !== usuarioId) {
      const err = new Error('Sem permissão para deletar esta skill');
      err.status = 403;
      throw err;
    }
    await skill.destroy();
    return { sucesso: true };
  }
}

module.exports = RoteamentoService;
