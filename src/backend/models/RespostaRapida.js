'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class RespostaRapida extends Model {}

RespostaRapida.init(
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
    titulo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    conteudo: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    atalho: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [1, 50],
        isValidAtalho(value) {
          if (value && !value.match(/^\/[a-z0-9_-]+$/i)) {
            throw new Error('Atalho deve ser /exemplo (letras, números, _ e -)');
          }
        },
      },
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'RespostaRapida',
    tableName: 'respostas_rapidas',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
    indexes: [
      { fields: ['cliente_id'] },
    ],
  }
);

module.exports = RespostaRapida;
