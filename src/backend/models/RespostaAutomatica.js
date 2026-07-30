'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class RespostaAutomatica extends Model {}

RespostaAutomatica.init(
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
    palavra_chave: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    resposta: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    tipo: {
      type: DataTypes.ENUM('exato', 'contem', 'regex'),
      defaultValue: 'exato',
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'RespostaAutomatica',
    tableName: 'respostas_automaticas',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
    indexes: [
      { fields: ['cliente_id'] },
      { fields: ['palavra_chave'] },
    ],
  }
);

module.exports = RespostaAutomatica;
