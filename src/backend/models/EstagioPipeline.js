'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class EstagioPipeline extends Model {}

EstagioPipeline.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    nome: { type: DataTypes.STRING, allowNull: false },
    descricao: { type: DataTypes.TEXT },
    cor: { type: DataTypes.STRING(20), defaultValue: '#3B82F6' },
    ordem: { type: DataTypes.INTEGER, defaultValue: 0 },
    ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'EstagioPipeline',
    tableName: 'estagios_pipeline',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  }
);

module.exports = EstagioPipeline;
