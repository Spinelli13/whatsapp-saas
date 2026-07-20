'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Email extends Model {}

Email.init({
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
  destinatario_email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assunto: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  corpo: DataTypes.TEXT,
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
  anexos: DataTypes.JSONB,
  mensagem_id_externo: DataTypes.STRING,
  erro_mensagem: DataTypes.TEXT,
  data_envio: DataTypes.DATE,
}, {
  sequelize,
  modelName: 'Email',
  tableName: 'emails',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
});

module.exports = Email;
