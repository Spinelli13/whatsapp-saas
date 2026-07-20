'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Oportunidade extends Model {}

Oportunidade.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    titulo: { type: DataTypes.STRING, allowNull: false },
    descricao: { type: DataTypes.TEXT },
    valor: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    estagio_id: { type: DataTypes.UUID, allowNull: true },
    contato_id: { type: DataTypes.INTEGER, allowNull: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    probabilidade: { type: DataTypes.INTEGER, defaultValue: 50 },
    data_fechamento_esperada: { type: DataTypes.DATE },
    data_fechamento_real: { type: DataTypes.DATE },
    status: {
      type: DataTypes.ENUM('aberta', 'ganha', 'perdida', 'em_andamento'),
      defaultValue: 'aberta',
    },
    motivo_perda: { type: DataTypes.TEXT },
    posicao_coluna: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'Oportunidade',
    tableName: 'oportunidades',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  }
);

module.exports = Oportunidade;
