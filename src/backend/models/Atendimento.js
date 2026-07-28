'use strict';

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

class Atendimento extends Model {}

Atendimento.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  numero_whatsapp: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  nome_cliente: DataTypes.STRING(150),
  status: {
    type: DataTypes.ENUM('pendente', 'ativo', 'encerrado'),
    defaultValue: 'pendente',
  },
  prioridade: {
    type: DataTypes.ENUM('baixa', 'media', 'alta'),
    defaultValue: 'media',
  },
  setor: DataTypes.STRING(100),
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  feedback_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  dados_cliente: DataTypes.JSONB,
  ultima_mensagem: DataTypes.TEXT,
}, {
  sequelize,
  modelName: 'Atendimento',
  tableName: 'atendimentos',
  timestamps: true,
  createdAt: 'criado_em',
  updatedAt: 'atualizado_em',
});

module.exports = Atendimento;
