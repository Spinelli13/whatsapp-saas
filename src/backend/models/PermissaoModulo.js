'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class PermissaoModulo extends Model {}

PermissaoModulo.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    modulo_id: { type: DataTypes.INTEGER, allowNull: false },
    ativado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'PermissaoModulo',
    tableName: 'permissoes_modulo',
    timestamps: false,
  }
);

module.exports = PermissaoModulo;
