'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class CalendarioEvento extends Model {}

CalendarioEvento.init({
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
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  data_fim: DataTypes.DATE,
  local: DataTypes.STRING,
  tipo: {
    type: DataTypes.ENUM('reuniao', 'chamada', 'visita', 'deadline', 'outro'),
    defaultValue: 'outro',
  },
  cor: DataTypes.STRING(20),
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tarefa_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  oportunidade_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  participantes: DataTypes.JSONB,
  notificacao: {
    type: DataTypes.ENUM('nenhuma', '15min', '30min', '1h', '1dia'),
    defaultValue: '15min',
  },
}, {
  sequelize,
  modelName: 'CalendarioEvento',
  tableName: 'calendario_eventos',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
});

module.exports = CalendarioEvento;
