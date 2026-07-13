'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class FilaMensagem extends Model {}

FilaMensagem.init(
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
    departamento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    telefone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // status operacional da fila (aguardando atendente)
    status: {
      type: DataTypes.ENUM('aguardando', 'atribuido', 'fechado'),
      allowNull: false,
      defaultValue: 'aguardando',
    },
    // status do ciclo de vida do ticket
    ticket_status: {
      type: DataTypes.ENUM('novo', 'respondendo', 'resolvido', 'fechado', 'reaberto'),
      allowNull: false,
      defaultValue: 'novo',
    },
    atendente_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    posicao_fila: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    satisfaction_rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 },
    },
    respondido_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    respondido_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'FilaMensagem',
    tableName: 'fila_mensagens',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['cliente_id', 'departamento_id', 'status'] },
      { fields: ['cliente_id', 'telefone', 'status'] },
    ],
  }
);

module.exports = FilaMensagem;
