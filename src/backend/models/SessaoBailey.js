const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class SessaoBailey extends Model {}

SessaoBailey.init(
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
    estado_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'SessaoBailey',
    tableName: 'sessoes_baileys',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['cliente_id', 'numero'] },
    ],
  }
);

module.exports = SessaoBailey;
