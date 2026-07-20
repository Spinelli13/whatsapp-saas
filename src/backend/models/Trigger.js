'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Trigger extends Model {}

Trigger.init(
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
    tipo: {
      type: DataTypes.ENUM(
        'oportunidade_criada',
        'oportunidade_atualizada',
        'oportunidade_ganha',
        'oportunidade_perdida',
        'tarefa_criada',
        'tarefa_concluida',
        'email_enviado',
        'sms_enviado',
        'data_vencimento',
        'webhook'
      ),
      allowNull: false,
    },
    condicoes: DataTypes.JSON,
  },
  {
    sequelize,
    modelName: 'Trigger',
    tableName: 'triggers',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  }
);

module.exports = Trigger;
