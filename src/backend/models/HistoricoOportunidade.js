'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class HistoricoOportunidade extends Model {}

HistoricoOportunidade.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    oportunidade_id: { type: DataTypes.UUID, allowNull: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    acao: { type: DataTypes.STRING(100), allowNull: false },
    campo_alterado: { type: DataTypes.STRING(100) },
    valor_anterior: { type: DataTypes.TEXT },
    valor_novo: { type: DataTypes.TEXT },
  },
  {
    sequelize,
    modelName: 'HistoricoOportunidade',
    tableName: 'historico_oportunidade',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: false,
  }
);

module.exports = HistoricoOportunidade;
