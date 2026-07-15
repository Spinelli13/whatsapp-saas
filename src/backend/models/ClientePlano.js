'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class ClientePlano extends Model {}

ClientePlano.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    plano_id: { type: DataTypes.INTEGER, allowNull: false },
    data_inicio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    data_proxima_renovacao: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM('ativo', 'cancelado', 'suspenso'),
      defaultValue: 'ativo',
    },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'ClientePlano',
    tableName: 'cliente_plano',
    timestamps: false,
  }
);

module.exports = ClientePlano;
