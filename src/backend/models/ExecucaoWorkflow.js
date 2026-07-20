'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class ExecucaoWorkflow extends Model {}

ExecucaoWorkflow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    workflow_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    oportunidade_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tarefa_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pendente', 'executando', 'sucesso', 'erro'),
      defaultValue: 'pendente',
    },
    resultado: DataTypes.JSON,
    erro_mensagem: DataTypes.TEXT,
    data_inicio: DataTypes.DATE,
    data_fim: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'ExecucaoWorkflow',
    tableName: 'execucoes_workflow',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: false,
  }
);

module.exports = ExecucaoWorkflow;
