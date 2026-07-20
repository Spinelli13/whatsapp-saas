'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class PrevisaoIA extends Model {}

PrevisaoIA.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    oportunidade_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tipo: {
      type: DataTypes.ENUM('probabilidade_ganho', 'tempo_fechamento', 'churn_risk'),
      defaultValue: 'probabilidade_ganho',
    },
    predicao: DataTypes.DECIMAL(5, 2),
    confianca: DataTypes.DECIMAL(5, 2),
    fatores: DataTypes.JSON,
  },
  {
    sequelize,
    modelName: 'PrevisaoIA',
    tableName: 'previsoes_ia',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: false,
  }
);

module.exports = PrevisaoIA;
