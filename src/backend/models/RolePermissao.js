'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class RolePermissao extends Model {}

RolePermissao.init(
  {
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    permissao_id: { type: DataTypes.INTEGER, allowNull: false },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'RolePermissao',
    tableName: 'role_permissoes',
    timestamps: false,
  }
);

module.exports = RolePermissao;
