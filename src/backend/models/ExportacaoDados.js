'use strict';

const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class ExportacaoDados extends Model {}

ExportacaoDados.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('pendente', 'processando', 'pronto', 'erro'),
      defaultValue: 'pendente',
    },
    arquivo_url: { type: DataTypes.STRING(500) },
    tamanho_mb: { type: DataTypes.DECIMAL(10, 2) },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expira_em: {
      type: DataTypes.DATE,
      defaultValue: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  {
    sequelize,
    modelName: 'ExportacaoDados',
    tableName: 'exportacao_dados',
    timestamps: false,
    indexes: [
      { fields: ['usuario_id', 'status'] },
      { fields: ['cliente_id'] },
    ],
  }
);

module.exports = ExportacaoDados;
