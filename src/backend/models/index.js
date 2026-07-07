const sequelize = require('../config/sequelize');

const Cliente = require('./Cliente');
const Usuario = require('./Usuario');
const Departamento = require('./Departamento');
const WhatsappNumero = require('./WhatsappNumero');
const FilaMensagem = require('./FilaMensagem');
const MensagemAutomatica = require('./MensagemAutomatica');
const SessaoBailey = require('./SessaoBailey');
const AtendenteDepartamento = require('./AtendenteDepartamento');

// ── Associações ────────────────────────────────────────────────

Cliente.hasMany(Usuario,              { foreignKey: 'cliente_id', as: 'usuarios',              onDelete: 'CASCADE' });
Cliente.hasMany(Departamento,         { foreignKey: 'cliente_id', as: 'departamentos',          onDelete: 'CASCADE' });
Cliente.hasMany(WhatsappNumero,       { foreignKey: 'cliente_id', as: 'numeros',                onDelete: 'CASCADE' });
Cliente.hasMany(FilaMensagem,         { foreignKey: 'cliente_id', as: 'fila',                   onDelete: 'CASCADE' });
Cliente.hasMany(MensagemAutomatica,   { foreignKey: 'cliente_id', as: 'mensagensAutomaticas',   onDelete: 'CASCADE' });
Cliente.hasMany(SessaoBailey,         { foreignKey: 'cliente_id', as: 'sessoes',                onDelete: 'CASCADE' });

Usuario.belongsTo(Cliente,            { foreignKey: 'cliente_id', as: 'cliente' });
Usuario.hasMany(AtendenteDepartamento,{ foreignKey: 'usuario_id', as: 'departamentosAtribuidos' });

Departamento.belongsTo(Cliente,       { foreignKey: 'cliente_id', as: 'cliente' });
Departamento.hasMany(FilaMensagem,    { foreignKey: 'departamento_id', as: 'fila' });
Departamento.hasMany(AtendenteDepartamento, { foreignKey: 'departamento_id', as: 'atendentes' });

WhatsappNumero.belongsTo(Cliente,     { foreignKey: 'cliente_id', as: 'cliente' });

FilaMensagem.belongsTo(Cliente,       { foreignKey: 'cliente_id',     as: 'cliente' });
FilaMensagem.belongsTo(Departamento,  { foreignKey: 'departamento_id', as: 'departamento' });
FilaMensagem.belongsTo(Usuario,       { foreignKey: 'atendente_id',    as: 'atendente' });

MensagemAutomatica.belongsTo(Cliente,     { foreignKey: 'cliente_id',     as: 'cliente' });
MensagemAutomatica.belongsTo(Departamento,{ foreignKey: 'departamento_id', as: 'departamento' });

SessaoBailey.belongsTo(Cliente,       { foreignKey: 'cliente_id', as: 'cliente' });

AtendenteDepartamento.belongsTo(Usuario,     { foreignKey: 'usuario_id',     as: 'usuario' });
AtendenteDepartamento.belongsTo(Departamento,{ foreignKey: 'departamento_id', as: 'departamento' });

module.exports = {
  sequelize,
  Cliente,
  Usuario,
  Departamento,
  WhatsappNumero,
  FilaMensagem,
  MensagemAutomatica,
  SessaoBailey,
  AtendenteDepartamento,
};
