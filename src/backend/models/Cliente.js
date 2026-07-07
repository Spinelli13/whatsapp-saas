const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Cliente extends Model {}

Cliente.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Nome é obrigatório' },
        len: { args: [2, 150], msg: 'Nome deve ter entre 2 e 150 caracteres' },
      },
    },
    plano: {
      type: DataTypes.ENUM('basico', 'profissional', 'enterprise'),
      allowNull: false,
      defaultValue: 'basico',
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo', 'suspenso'),
      allowNull: false,
      defaultValue: 'ativo',
    },
  },
  {
    sequelize,
    modelName: 'Cliente',
    tableName: 'clientes',
    timestamps: true,
    createdAt: 'data_criacao',
    updatedAt: 'data_atualizacao',
  }
);

module.exports = Cliente;
