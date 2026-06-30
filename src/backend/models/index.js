const sequelize = require('../config/database');
const Cliente = require('./Cliente');
const Usuario = require('./Usuario');

Cliente.hasMany(Usuario, {
  foreignKey: 'cliente_id',
  as: 'usuarios',
  onDelete: 'CASCADE',
});

Usuario.belongsTo(Cliente, {
  foreignKey: 'cliente_id',
  as: 'cliente',
});

module.exports = { sequelize, Cliente, Usuario };
