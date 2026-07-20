'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class AcaoAutomacao extends Model {}

AcaoAutomacao.init(
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
    sequencia: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM(
        'atualizar_campo',
        'criar_tarefa',
        'enviar_email',
        'enviar_sms',
        'mover_oportunidade',
        'atribuir_usuario',
        'adicionar_tag',
        'webhook'
      ),
      allowNull: false,
    },
    parametros: DataTypes.JSON,
  },
  {
    sequelize,
    modelName: 'AcaoAutomacao',
    tableName: 'acoes_automacao',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  }
);

module.exports = AcaoAutomacao;
