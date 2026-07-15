'use strict';

const sequelize = require('../config/sequelize');

const Cliente = require('./Cliente');
const Usuario = require('./Usuario');
const Departamento = require('./Departamento');
const WhatsappNumero = require('./WhatsappNumero');
const FilaMensagem = require('./FilaMensagem');
const MensagemAutomatica = require('./MensagemAutomatica');
const SessaoBailey = require('./SessaoBailey');
const AtendenteDepartamento = require('./AtendenteDepartamento');
const NotaTicket = require('./NotaTicket');
const HistoricoTicket = require('./HistoricoTicket');
const Role = require('./Role');
const Permissao = require('./Permissao');

// ── Associações base ───────────────────────────────────────────────────────

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
FilaMensagem.hasMany(NotaTicket,      { foreignKey: 'ticket_id',       as: 'notas',      onDelete: 'CASCADE' });
FilaMensagem.hasMany(HistoricoTicket, { foreignKey: 'ticket_id',       as: 'historico',  onDelete: 'CASCADE' });

MensagemAutomatica.belongsTo(Cliente,     { foreignKey: 'cliente_id',     as: 'cliente' });
MensagemAutomatica.belongsTo(Departamento,{ foreignKey: 'departamento_id', as: 'departamento' });

SessaoBailey.belongsTo(Cliente,       { foreignKey: 'cliente_id', as: 'cliente' });

AtendenteDepartamento.belongsTo(Usuario,     { foreignKey: 'usuario_id',     as: 'usuario' });
AtendenteDepartamento.belongsTo(Departamento,{ foreignKey: 'departamento_id', as: 'departamento' });

NotaTicket.belongsTo(FilaMensagem, { foreignKey: 'ticket_id',   as: 'ticket' });
NotaTicket.belongsTo(Usuario,      { foreignKey: 'usuario_id',  as: 'autor' });

HistoricoTicket.belongsTo(FilaMensagem, { foreignKey: 'ticket_id',  as: 'ticket' });
HistoricoTicket.belongsTo(Usuario,      { foreignKey: 'usuario_id', as: 'usuario' });

// ── RBAC associations ──────────────────────────────────────────────────────

Cliente.hasMany(Role,    { foreignKey: 'cliente_id', as: 'roles',    onDelete: 'CASCADE' });
Role.belongsTo(Cliente,  { foreignKey: 'cliente_id', as: 'cliente' });

Role.belongsToMany(Permissao, { through: 'role_permissoes', foreignKey: 'role_id',     otherKey: 'permissao_id', as: 'Permissaos' });
Permissao.belongsToMany(Role, { through: 'role_permissoes', foreignKey: 'permissao_id', otherKey: 'role_id',      as: 'Roles' });

Usuario.belongsTo(Role, { foreignKey: 'role_id', as: 'role_obj' });
Role.hasMany(Usuario,   { foreignKey: 'role_id', as: 'usuarios_com_role' });

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
  NotaTicket,
  HistoricoTicket,
  Role,
  Permissao,
};
