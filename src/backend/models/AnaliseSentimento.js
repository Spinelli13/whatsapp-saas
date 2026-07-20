'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class AnaliseSentimento extends Model {}

AnaliseSentimento.init(
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
    email_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    sms_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    texto: DataTypes.TEXT,
    sentimento: {
      type: DataTypes.ENUM('positivo', 'neutro', 'negativo'),
      defaultValue: 'neutro',
    },
    confianca: DataTypes.DECIMAL(5, 2),
    palavras_chave: DataTypes.JSON,
  },
  {
    sequelize,
    modelName: 'AnaliseSentimento',
    tableName: 'analise_sentimento',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: false,
  }
);

module.exports = AnaliseSentimento;
