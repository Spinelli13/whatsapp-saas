'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Usuario2FA extends Model {}

Usuario2FA.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.ENUM('sms', 'totp', 'none'), defaultValue: 'none' },
    telefone_2fa: { type: DataTypes.STRING(20), allowNull: true },
    totp_secret: { type: DataTypes.STRING(500), allowNull: true },
    ativado: { type: DataTypes.BOOLEAN, defaultValue: false },
    backup_codes: { type: DataTypes.JSONB, defaultValue: [] },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    atualizado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'Usuario2FA',
    tableName: 'usuario_2fa',
    timestamps: false,
  }
);

module.exports = Usuario2FA;
