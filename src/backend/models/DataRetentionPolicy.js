'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class DataRetentionPolicy extends Model {}

DataRetentionPolicy.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    dias_retencao_historico: { type: DataTypes.INTEGER, defaultValue: 180 },
    dias_retencao_logs: { type: DataTypes.INTEGER, defaultValue: 90 },
    deletar_automaticamente: { type: DataTypes.BOOLEAN, defaultValue: true },
    atualizado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'DataRetentionPolicy',
    tableName: 'data_retention_policy',
    timestamps: false,
  }
);

module.exports = DataRetentionPolicy;
