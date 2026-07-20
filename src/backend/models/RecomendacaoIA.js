'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class RecomendacaoIA extends Model {}

RecomendacaoIA.init(
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
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    oportunidade_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tipo: {
      type: DataTypes.ENUM('proximo_passo', 'risco_perda', 'melhor_momento', 'personalizacao'),
      defaultValue: 'proximo_passo',
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descricao: DataTypes.TEXT,
    acao_sugerida: DataTypes.STRING,
    prioridade: {
      type: DataTypes.ENUM('baixa', 'media', 'alta'),
      defaultValue: 'media',
    },
    visualizado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'RecomendacaoIA',
    tableName: 'recomendacoes_ia',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: false,
  }
);

module.exports = RecomendacaoIA;
