const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class MensagemAutomatica extends Model {}

MensagemAutomatica.init(
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
    departamento_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    palavra_chave: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    resposta: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo'),
      allowNull: false,
      defaultValue: 'ativo',
    },
  },
  {
    sequelize,
    modelName: 'MensagemAutomatica',
    tableName: 'mensagens_automaticas',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['cliente_id', 'status'] }],
  }
);

module.exports = MensagemAutomatica;
