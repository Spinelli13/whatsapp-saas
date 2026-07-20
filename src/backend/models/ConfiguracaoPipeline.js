'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class ConfiguracaoPipeline extends Model {}

ConfiguracaoPipeline.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    moeda: { type: DataTypes.STRING(10), defaultValue: 'BRL' },
    dias_ciclo_vendas_esperado: { type: DataTypes.INTEGER, defaultValue: 30 },
    mostrar_probabilidade: { type: DataTypes.BOOLEAN, defaultValue: true },
    mostrar_valor_esperado: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'ConfiguracaoPipeline',
    tableName: 'configuracao_pipeline',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  }
);

module.exports = ConfiguracaoPipeline;
