'use strict';
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Avaliacao extends Model {}

Avaliacao.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    atendimento_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nota_csat: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    nota_nps: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0, max: 10 },
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Avaliacao',
    tableName: 'avaliacoes',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
    indexes: [
      { fields: ['atendimento_id'] },
      { fields: ['cliente_id'] },
      { fields: ['usuario_id'] },
    ],
  }
);

module.exports = Avaliacao;
