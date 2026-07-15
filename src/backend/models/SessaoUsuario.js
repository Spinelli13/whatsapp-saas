'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class SessaoUsuario extends Model {}

SessaoUsuario.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    token_refresh: { type: DataTypes.STRING(500), allowNull: false, unique: true },
    dispositivo_id: { type: DataTypes.INTEGER, allowNull: true },
    expira_em: { type: DataTypes.DATE, allowNull: false },
    ativa: { type: DataTypes.BOOLEAN, defaultValue: true },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'SessaoUsuario',
    tableName: 'sessao_usuario',
    timestamps: false,
  }
);

module.exports = SessaoUsuario;
