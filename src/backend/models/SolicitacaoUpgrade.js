'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class SolicitacaoUpgrade extends Model {}

SolicitacaoUpgrade.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    admin_id: { type: DataTypes.INTEGER, allowNull: true },
    tipo: { type: DataTypes.ENUM('plano', 'modulo'), allowNull: false },
    plano_id: { type: DataTypes.INTEGER, allowNull: true },
    modulo_id: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM('pendente', 'aprovado', 'recusado'),
      allowNull: false,
      defaultValue: 'pendente',
    },
    motivo_recusa: { type: DataTypes.TEXT, allowNull: true },
    data_solicitacao: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    data_aprovacao: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'SolicitacaoUpgrade',
    tableName: 'solicitacoes_upgrade',
    timestamps: false,
  }
);

module.exports = SolicitacaoUpgrade;
