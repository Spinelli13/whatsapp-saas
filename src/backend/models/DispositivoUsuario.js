'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class DispositivoUsuario extends Model {}

DispositivoUsuario.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    nome: { type: DataTypes.STRING(255), allowNull: true },
    device_id: { type: DataTypes.STRING(255), allowNull: false },
    user_agent: { type: DataTypes.TEXT, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    ultimo_acesso: { type: DataTypes.DATE, allowNull: true },
    trusted: { type: DataTypes.BOOLEAN, defaultValue: false },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'DispositivoUsuario',
    tableName: 'dispositivo_usuario',
    timestamps: false,
  }
);

module.exports = DispositivoUsuario;
