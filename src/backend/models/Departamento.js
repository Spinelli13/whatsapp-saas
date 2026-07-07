const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class Departamento extends Model {}

Departamento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: 'Nome é obrigatório' } },
    },
    emoji: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Departamento',
    tableName: 'departamentos',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['cliente_id', 'ativo'] }],
  }
);

module.exports = Departamento;
