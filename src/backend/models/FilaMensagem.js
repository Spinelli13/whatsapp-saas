const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class FilaMensagem extends Model {}

FilaMensagem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    departamento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    telefone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('aguardando', 'atribuido', 'fechado'),
      allowNull: false,
      defaultValue: 'aguardando',
    },
    atendente_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    posicao_fila: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'FilaMensagem',
    tableName: 'fila_mensagens',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['cliente_id', 'departamento_id', 'status'] },
      { fields: ['cliente_id', 'telefone', 'status'] },
    ],
  }
);

module.exports = FilaMensagem;
