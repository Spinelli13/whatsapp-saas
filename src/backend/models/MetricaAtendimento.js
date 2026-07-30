'use strict';
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class MetricaAtendimento extends Model {}

MetricaAtendimento.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    atendimento_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    departamento_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tempo_espera_ms: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tempo_atendimento_ms: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tempo_primeira_resposta_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mensagens_total: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    satisfacao_csat: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    transferencias: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    finalizado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'MetricaAtendimento',
    tableName: 'metricas_atendimentos',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
    indexes: [
      { fields: ['cliente_id'] },
      { fields: ['usuario_id'] },
      { fields: ['departamento_id'] },
      { fields: ['atendimento_id'] },
      { fields: ['criado_em'] },
    ],
  }
);

module.exports = MetricaAtendimento;
