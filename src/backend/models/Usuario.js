const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Usuario extends Model {}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: { msg: 'Email já está em uso' },
      validate: {
        isEmail: { msg: 'Email inválido' },
        notEmpty: { msg: 'Email é obrigatório' },
      },
    },
    senha: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: 'Senha é obrigatória' } },
    },
    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: { msg: 'Nome é obrigatório' } },
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'atendente'),
      allowNull: false,
      defaultValue: 'atendente',
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo'),
      allowNull: false,
      defaultValue: 'ativo',
    },
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'data_criacao',
    updatedAt: 'data_atualizacao',
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['cliente_id'] },
    ],
  }
);

module.exports = Usuario;
