'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Plano extends Model {}

Plano.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    preco_mensal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    usuarios_limite: { type: DataTypes.INTEGER, allowNull: false },
    mensagens_limite: { type: DataTypes.INTEGER, allowNull: false },
    departamentos_limite: { type: DataTypes.INTEGER, allowNull: false },
    features: { type: DataTypes.JSONB, defaultValue: [] },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'Plano',
    tableName: 'planos',
    timestamps: false,
  }
);

module.exports = Plano;
