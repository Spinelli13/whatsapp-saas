'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class SMS extends Model {}

SMS.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  usuario_id: DataTypes.INTEGER,
  numero_destino: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('enviado', 'recebido'),
    defaultValue: 'enviado',
  },
  status: {
    type: DataTypes.ENUM('rascunho', 'enviando', 'enviado', 'erro'),
    defaultValue: 'rascunho',
  },
  oportunidade_id: { type: DataTypes.UUID, allowNull: true },
  tarefa_id:       { type: DataTypes.UUID, allowNull: true },
  sid_externo: DataTypes.STRING,
  erro_mensagem: DataTypes.TEXT,
  data_envio: DataTypes.DATE,
}, {
  sequelize,
  modelName: 'SMS',
  tableName: 'sms',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
});

module.exports = SMS;
