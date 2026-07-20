'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Tarefa extends Model {}

Tarefa.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descricao: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM('todo', 'em_progresso', 'concluida'),
    defaultValue: 'todo',
  },
  prioridade: {
    type: DataTypes.ENUM('baixa', 'media', 'alta', 'critica'),
    defaultValue: 'media',
  },
  usuario_atribuido_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  usuario_criador_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  data_vencimento: DataTypes.DATE,
  data_inicio: DataTypes.DATE,
  data_conclusao: DataTypes.DATE,
  tags: DataTypes.JSONB,
  oportunidade_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  posicao_coluna: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  sequelize,
  modelName: 'Tarefa',
  tableName: 'tarefas',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
});

module.exports = Tarefa;
