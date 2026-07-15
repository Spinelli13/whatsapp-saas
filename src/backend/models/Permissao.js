'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Permissao extends Model {}

Permissao.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['fila', 'notas', 'usuarios', 'relatorios', 'configuracoes']],
      },
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Permissao',
    tableName: 'permissoes',
    timestamps: false,
  }
);

module.exports = Permissao;
