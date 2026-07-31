'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class ClienteModulos extends Model {}

ClienteModulos.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    modulo_id: { type: DataTypes.INTEGER, allowNull: false },
    data_adicionado: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'ClienteModulos',
    tableName: 'cliente_modulos',
    timestamps: false,
  }
);

module.exports = ClienteModulos;
