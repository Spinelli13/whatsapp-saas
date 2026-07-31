'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Modulo extends Model {}

Modulo.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    descricao: { type: DataTypes.STRING(255), allowNull: true },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'Modulo',
    tableName: 'modulos',
    timestamps: false,
  }
);

module.exports = Modulo;
