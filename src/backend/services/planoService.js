'use strict';

const { Plano, ClientePlano, UsoCliente, Usuario } = require('../models');

function mesAtual() {
  return new Date().toISOString().substring(0, 7); // YYYY-MM
}

const PlanoService = {
  async listarPlanos() {
    return Plano.findAll({ order: [['preco_mensal', 'ASC']] });
  },

  async obterPlanoCliente(cliente_id) {
    return ClientePlano.findOne({
      where: { cliente_id, status: 'ativo' },
      include: [{ model: Plano, as: 'Plano' }],
    });
  },

  async atribuirPlanoCliente(cliente_id, plano_id) {
    const plano = await Plano.findByPk(plano_id);
    if (!plano) throw new Error('Plano não encontrado');

    await ClientePlano.update(
      { status: 'cancelado' },
      { where: { cliente_id, status: 'ativo' } }
    );

    const proxRenovacao = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const [novoPlano] = await ClientePlano.findOrCreate({
      where: { cliente_id, plano_id },
      defaults: { status: 'ativo', data_proxima_renovacao: proxRenovacao },
    });
    await novoPlano.update({ status: 'ativo', data_proxima_renovacao: proxRenovacao });
    return novoPlano;
  },

  async obterUsoCliente(cliente_id) {
    return UsoCliente.findOne({ where: { cliente_id, mes_ano: mesAtual() } });
  },

  async incrementarMensagens(cliente_id, quantidade = 1) {
    const [uso] = await UsoCliente.findOrCreate({
      where: { cliente_id, mes_ano: mesAtual() },
      defaults: { mensagens_usadas: 0, usuarios_criados: 0, departamentos_criados: 0 },
    });
    uso.mensagens_usadas += quantidade;
    return uso.save();
  },

  async incrementarUsuarios(cliente_id) {
    const [uso] = await UsoCliente.findOrCreate({
      where: { cliente_id, mes_ano: mesAtual() },
      defaults: { mensagens_usadas: 0, usuarios_criados: 0, departamentos_criados: 0 },
    });
    uso.usuarios_criados += 1;
    return uso.save();
  },

  async verificarLimites(cliente_id) {
    const planoData = await this.obterPlanoCliente(cliente_id);
    if (!planoData) throw new Error('Cliente sem plano');

    const plano = planoData.Plano;
    const uso = await this.obterUsoCliente(cliente_id);

    return {
      mensagens: {
        usado: uso?.mensagens_usadas ?? 0,
        limite: plano.mensagens_limite,
        atingiu: (uso?.mensagens_usadas ?? 0) >= plano.mensagens_limite,
      },
      usuarios: {
        usado: uso?.usuarios_criados ?? 0,
        limite: plano.usuarios_limite,
        atingiu: (uso?.usuarios_criados ?? 0) >= plano.usuarios_limite,
      },
      departamentos: {
        usado: uso?.departamentos_criados ?? 0,
        limite: plano.departamentos_limite,
        atingiu: (uso?.departamentos_criados ?? 0) >= plano.departamentos_limite,
      },
    };
  },

  async podeUsarFeature(cliente_id, feature) {
    const planoData = await this.obterPlanoCliente(cliente_id);
    if (!planoData) throw new Error('Cliente sem plano');
    const features = planoData.Plano.features;
    return features.includes('*') || features.includes(feature);
  },
};

module.exports = PlanoService;
