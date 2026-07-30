'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class FluxoBot extends Model {}

FluxoBot.init(
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
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estrutura_json: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { nodes: [], edges: [] },
    },
    mensagem_saudacao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mensagem_despedida: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'FluxoBot',
    tableName: 'fluxos_bot',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
    indexes: [
      { fields: ['cliente_id'] },
      { fields: ['ativo'] },
    ],
  }
);

module.exports = FluxoBot;
