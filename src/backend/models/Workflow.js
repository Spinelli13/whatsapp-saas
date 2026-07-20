'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Workflow extends Model {}

Workflow.init(
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    descricao: DataTypes.TEXT,
    tipo: {
      type: DataTypes.ENUM('trigger_manual', 'trigger_evento', 'agendado'),
      defaultValue: 'trigger_manual',
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo', 'pausado'),
      defaultValue: 'ativo',
    },
    definicao: DataTypes.JSON,
    fluxo_visual: DataTypes.JSON,
    execucoes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Workflow',
    tableName: 'workflows',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  }
);

module.exports = Workflow;
