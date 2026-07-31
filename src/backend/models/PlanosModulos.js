'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class PlanosModulos extends Model {}

PlanosModulos.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    plano_id: { type: DataTypes.INTEGER, allowNull: false },
    modulo_id: { type: DataTypes.INTEGER, allowNull: false },
    data_adicionado: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'PlanosModulos',
    tableName: 'planos_modulos',
    timestamps: false,
  }
);

module.exports = PlanosModulos;
