'use strict';
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Transferencia extends Model {}

Transferencia.init(
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
    atendente_origem_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    atendente_destino_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pendente', 'aceita', 'rejeitada', 'cancelada'),
      defaultValue: 'pendente',
    },
    departamento_destino_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mensagem_rejeicao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Transferencia',
    tableName: 'transferencias',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
    indexes: [
      { fields: ['atendimento_id'] },
      { fields: ['cliente_id'] },
      { fields: ['atendente_origem_id'] },
      { fields: ['atendente_destino_id'] },
      { fields: ['status'] },
      { fields: ['criado_em'] },
    ],
  }
);

module.exports = Transferencia;
