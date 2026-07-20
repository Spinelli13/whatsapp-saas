'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class ConfiguracaoTarefa extends Model {}

ConfiguracaoTarefa.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  mostrar_apenas_minhas: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  notificar_atribuicao: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  notificar_vencimento: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize,
  modelName: 'ConfiguracaoTarefa',
  tableName: 'configuracao_tarefas',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
});

module.exports = ConfiguracaoTarefa;
