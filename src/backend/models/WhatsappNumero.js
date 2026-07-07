const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class WhatsappNumero extends Model {}

WhatsappNumero.init(
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
    numero: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pendente', 'ativo', 'desconectado'),
      allowNull: false,
      defaultValue: 'pendente',
    },
    integrado_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ultima_msg: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'WhatsappNumero',
    tableName: 'whatsapp_numeros',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['cliente_id'] }],
  }
);

module.exports = WhatsappNumero;
