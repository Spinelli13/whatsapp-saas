'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class ConfiguracaoComunicacao extends Model {}

ConfiguracaoComunicacao.init({
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
  smtp_host: DataTypes.STRING,
  smtp_porta: DataTypes.INTEGER,
  smtp_usuario: DataTypes.STRING,
  smtp_senha: DataTypes.STRING,
  imap_host: DataTypes.STRING,
  imap_porta: DataTypes.INTEGER,
  imap_usuario: DataTypes.STRING,
  imap_senha: DataTypes.STRING,
  email_padrao: DataTypes.STRING,
  twilio_account_sid: DataTypes.STRING,
  twilio_auth_token: DataTypes.STRING,
  twilio_numero: DataTypes.STRING,
  notificar_email_recebido: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  notificar_sms_recebido: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize,
  modelName: 'ConfiguracaoComunicacao',
  tableName: 'configuracao_comunicacao',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
});

module.exports = ConfiguracaoComunicacao;
