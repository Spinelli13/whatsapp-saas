const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/sequelize');

class AtendenteDepartamento extends Model {}

AtendenteDepartamento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    departamento_id: {
      type: DataTypes.INTEGER,
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
    modelName: 'AtendenteDepartamento',
    tableName: 'atendentes_departamentos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { unique: true, fields: ['usuario_id', 'departamento_id'] },
      { fields: ['departamento_id', 'status'] },
    ],
  }
);

module.exports = AtendenteDepartamento;
