'use strict';
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class SkillAtendente extends Model {}

SkillAtendente.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nome_skill: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    nivel: {
      type: DataTypes.ENUM('basico', 'intermediario', 'avancado'),
      defaultValue: 'basico',
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'SkillAtendente',
    tableName: 'skills_atendentes',
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
    indexes: [
      { fields: ['usuario_id'] },
      { fields: ['cliente_id'] },
      { fields: ['nome_skill'] },
    ],
  }
);

module.exports = SkillAtendente;
