'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

const ACOES_VALIDAS = [
  'criado',
  'status_alterado',
  'nota_adicionada',
  'respondido',
  'transferido',
  'fechado',
  'reaberto',
  'rating_adicionado',
];

class HistoricoTicket extends Model {}

HistoricoTicket.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ticket_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    acao: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { isIn: [ACOES_VALIDAS] },
    },
    dados_anteriores: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    dados_novos: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'HistoricoTicket',
    tableName: 'historico_tickets',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: false,
  }
);

module.exports = HistoricoTicket;
