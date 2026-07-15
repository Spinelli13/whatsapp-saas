'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class UsoCliente extends Model {}

UsoCliente.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    mes_ano: { type: DataTypes.STRING(7), allowNull: false },
    mensagens_usadas: { type: DataTypes.INTEGER, defaultValue: 0 },
    usuarios_criados: { type: DataTypes.INTEGER, defaultValue: 0 },
    departamentos_criados: { type: DataTypes.INTEGER, defaultValue: 0 },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'UsoCliente',
    tableName: 'uso_cliente',
    timestamps: false,
  }
);

module.exports = UsoCliente;
