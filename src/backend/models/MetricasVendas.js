'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class MetricasVendas extends Model {}

MetricasVendas.init(
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
    data: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    total_oportunidades: { type: DataTypes.INTEGER, defaultValue: 0 },
    oportunidades_ganhas: { type: DataTypes.INTEGER, defaultValue: 0 },
    oportunidades_perdidas: { type: DataTypes.INTEGER, defaultValue: 0 },
    valor_total: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    valor_ganho: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    valor_perdido: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    taxa_conversao: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    ticket_medio: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'MetricasVendas',
    tableName: 'metricas_vendas',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: false,
  }
);

module.exports = MetricasVendas;
