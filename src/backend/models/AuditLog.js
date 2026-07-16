'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class AuditLog extends Model {}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: true },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    tabela: { type: DataTypes.STRING(100), allowNull: false },
    acao: { type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'), allowNull: false },
    dados_antes: { type: DataTypes.JSONB, defaultValue: null },
    dados_depois: { type: DataTypes.JSONB, defaultValue: null },
    ip_address: { type: DataTypes.STRING(45) },
    user_agent: { type: DataTypes.TEXT },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_log',
    timestamps: false,
    indexes: [
      { fields: ['usuario_id', 'criado_em'] },
      { fields: ['cliente_id', 'criado_em'] },
      { fields: ['tabela'] },
    ],
  }
);

module.exports = AuditLog;
