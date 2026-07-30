'use strict';
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class ConfiguracaoRoteamento extends Model {}

ConfiguracaoRoteamento.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    departamento_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tipo_roteamento: {
      type: DataTypes.ENUM('round_robin', 'least_busy', 'skill', 'manual'),
      defaultValue: 'least_busy',
    },
    limite_simultaneos: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    tempo_sla_minutos: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
    habilitar_transbordo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    departamento_transbordo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'ConfiguracaoRoteamento',
    tableName: 'configuracoes_roteamento',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
    indexes: [
      { fields: ['cliente_id'] },
      { fields: ['departamento_id'] },
    ],
  }
);

module.exports = ConfiguracaoRoteamento;
