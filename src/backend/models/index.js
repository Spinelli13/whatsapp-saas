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
const RolePermissao = require('./RolePermissao');
const Plano = require('./Plano');
const ClientePlano = require('./ClientePlano');
const UsoCliente = require('./UsoCliente');
const Usuario2FA = require('./Usuario2FA');
const DispositivoUsuario = require('./DispositivoUsuario');
const SessaoUsuario = require('./SessaoUsuario');
const AuditLog = require('./AuditLog');
const DataRetentionPolicy = require('./DataRetentionPolicy');
const ExportacaoDados = require('./ExportacaoDados');
const EstagioPipeline = require('./EstagioPipeline');
const Oportunidade = require('./Oportunidade');
const HistoricoOportunidade = require('./HistoricoOportunidade');
const ConfiguracaoPipeline = require('./ConfiguracaoPipeline');
const Tarefa = require('./Tarefa');
const CalendarioEvento = require('./CalendarioEvento');
const ConfiguracaoTarefa = require('./ConfiguracaoTarefa');
const Email = require('./Email');
const SMS = require('./SMS');
const ConfiguracaoComunicacao = require('./ConfiguracaoComunicacao');
const Workflow = require('./Workflow');
const Trigger = require('./Trigger');
const AcaoAutomacao = require('./AcaoAutomacao');
const ExecucaoWorkflow = require('./ExecucaoWorkflow');
const MetricasVendas = require('./MetricasVendas');
const AnaliseSentimento = require('./AnaliseSentimento');
const PrevisaoIA = require('./PrevisaoIA');
const RecomendacaoIA = require('./RecomendacaoIA');

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

Role.belongsToMany(Permissao, { through: RolePermissao, foreignKey: 'role_id',     otherKey: 'permissao_id', as: 'Permissaos' });
Permissao.belongsToMany(Role, { through: RolePermissao, foreignKey: 'permissao_id', otherKey: 'role_id',      as: 'Roles' });

Usuario.belongsTo(Role, { foreignKey: 'role_id', as: 'role_obj' });
Role.hasMany(Usuario,   { foreignKey: 'role_id', as: 'usuarios_com_role' });

// ── Planos associations ────────────────────────────────────────────────────

Plano.hasMany(ClientePlano,   { foreignKey: 'plano_id',   as: 'assinaturas' });
Cliente.hasMany(ClientePlano, { foreignKey: 'cliente_id', as: 'planos',     onDelete: 'CASCADE' });
Cliente.hasMany(UsoCliente,   { foreignKey: 'cliente_id', as: 'usos',       onDelete: 'CASCADE' });

ClientePlano.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
ClientePlano.belongsTo(Plano,   { foreignKey: 'plano_id',   as: 'Plano' });

UsoCliente.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

// ── LGPD / Audit associations ─────────────────────────────────────────────

AuditLog.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
AuditLog.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Cliente.hasMany(AuditLog, { foreignKey: 'cliente_id', as: 'auditLogs', onDelete: 'CASCADE' });

DataRetentionPolicy.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Cliente.hasOne(DataRetentionPolicy, { foreignKey: 'cliente_id', as: 'retentionPolicy', onDelete: 'CASCADE' });

ExportacaoDados.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
ExportacaoDados.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Cliente.hasMany(ExportacaoDados, { foreignKey: 'cliente_id', as: 'exportacoes', onDelete: 'CASCADE' });
Usuario.hasMany(ExportacaoDados, { foreignKey: 'usuario_id', as: 'exportacoes', onDelete: 'CASCADE' });

// ── 2FA / Session associations ─────────────────────────────────────────────

Usuario.hasOne(Usuario2FA,          { foreignKey: 'usuario_id', as: 'config2fa',    onDelete: 'CASCADE' });
Usuario2FA.belongsTo(Usuario,        { foreignKey: 'usuario_id', as: 'usuario' });

Usuario.hasMany(DispositivoUsuario,  { foreignKey: 'usuario_id', as: 'dispositivos', onDelete: 'CASCADE' });
DispositivoUsuario.belongsTo(Usuario,{ foreignKey: 'usuario_id', as: 'usuario' });
DispositivoUsuario.hasMany(SessaoUsuario, { foreignKey: 'dispositivo_id', as: 'sessoes' });

Usuario.hasMany(SessaoUsuario,       { foreignKey: 'usuario_id', as: 'sessoes',      onDelete: 'CASCADE' });
SessaoUsuario.belongsTo(Usuario,     { foreignKey: 'usuario_id', as: 'usuario' });
SessaoUsuario.belongsTo(DispositivoUsuario, { foreignKey: 'dispositivo_id', as: 'dispositivo' });

// ── Vendas / Pipeline associations ─────────────────────────────────────────

Cliente.hasMany(EstagioPipeline,    { foreignKey: 'cliente_id', as: 'estagios',      onDelete: 'CASCADE' });
EstagioPipeline.belongsTo(Cliente,  { foreignKey: 'cliente_id', as: 'cliente' });
EstagioPipeline.hasMany(Oportunidade, { foreignKey: 'estagio_id', as: 'oportunidades' });

Cliente.hasMany(Oportunidade,       { foreignKey: 'cliente_id', as: 'oportunidades', onDelete: 'CASCADE' });
Oportunidade.belongsTo(Cliente,     { foreignKey: 'cliente_id', as: 'cliente' });
Oportunidade.belongsTo(EstagioPipeline, { foreignKey: 'estagio_id', as: 'estagio' });
Oportunidade.belongsTo(Usuario,     { foreignKey: 'usuario_id', as: 'responsavel' });
Oportunidade.hasMany(HistoricoOportunidade, { foreignKey: 'oportunidade_id', as: 'historico', onDelete: 'CASCADE' });

HistoricoOportunidade.belongsTo(Oportunidade, { foreignKey: 'oportunidade_id', as: 'oportunidade' });
HistoricoOportunidade.belongsTo(Usuario,      { foreignKey: 'usuario_id',      as: 'usuario' });

Cliente.hasOne(ConfiguracaoPipeline,      { foreignKey: 'cliente_id', as: 'configPipeline', onDelete: 'CASCADE' });
ConfiguracaoPipeline.belongsTo(Cliente,   { foreignKey: 'cliente_id', as: 'cliente' });

// ── Tarefas / Calendário associations ──────────────────────────────────────

Cliente.hasMany(Tarefa,          { foreignKey: 'cliente_id', as: 'tarefas',  onDelete: 'CASCADE' });
Tarefa.belongsTo(Cliente,        { foreignKey: 'cliente_id', as: 'cliente' });
Tarefa.belongsTo(Usuario,        { foreignKey: 'usuario_atribuido_id', as: 'usuarioAtribuido' });
Tarefa.belongsTo(Usuario,        { foreignKey: 'usuario_criador_id',   as: 'usuarioCriador' });
Tarefa.belongsTo(Oportunidade,   { foreignKey: 'oportunidade_id',      as: 'oportunidade' });
Tarefa.hasMany(CalendarioEvento, { foreignKey: 'tarefa_id',            as: 'eventos', onDelete: 'CASCADE' });

Cliente.hasMany(CalendarioEvento,        { foreignKey: 'cliente_id', as: 'eventos', onDelete: 'CASCADE' });
CalendarioEvento.belongsTo(Cliente,      { foreignKey: 'cliente_id', as: 'cliente' });
CalendarioEvento.belongsTo(Usuario,      { foreignKey: 'usuario_id', as: 'usuario' });
CalendarioEvento.belongsTo(Tarefa,       { foreignKey: 'tarefa_id',  as: 'tarefa' });
CalendarioEvento.belongsTo(Oportunidade, { foreignKey: 'oportunidade_id', as: 'oportunidade' });

Cliente.hasOne(ConfiguracaoTarefa,       { foreignKey: 'cliente_id', as: 'configTarefas', onDelete: 'CASCADE' });
ConfiguracaoTarefa.belongsTo(Cliente,    { foreignKey: 'cliente_id', as: 'cliente' });

// ── Comunicação (Email / SMS) associations ─────────────────────────────────

Cliente.hasMany(Email,    { foreignKey: 'cliente_id', as: 'emails', onDelete: 'CASCADE' });
Email.belongsTo(Cliente,  { foreignKey: 'cliente_id', as: 'cliente' });
Email.belongsTo(Usuario,  { foreignKey: 'usuario_id', as: 'remetente' });
Email.belongsTo(Oportunidade, { foreignKey: 'oportunidade_id', as: 'oportunidade' });
Email.belongsTo(Tarefa,       { foreignKey: 'tarefa_id',       as: 'tarefa' });

Cliente.hasMany(SMS,      { foreignKey: 'cliente_id', as: 'mensagensSMS', onDelete: 'CASCADE' });
SMS.belongsTo(Cliente,    { foreignKey: 'cliente_id', as: 'cliente' });
SMS.belongsTo(Usuario,    { foreignKey: 'usuario_id', as: 'remetente' });
SMS.belongsTo(Oportunidade, { foreignKey: 'oportunidade_id', as: 'oportunidade' });
SMS.belongsTo(Tarefa,       { foreignKey: 'tarefa_id',       as: 'tarefa' });

Cliente.hasOne(ConfiguracaoComunicacao,     { foreignKey: 'cliente_id', as: 'configComunicacao', onDelete: 'CASCADE' });
ConfiguracaoComunicacao.belongsTo(Cliente,  { foreignKey: 'cliente_id', as: 'cliente' });

// ── Automações (Workflow / Trigger / AcaoAutomacao / ExecucaoWorkflow) ─────────

Cliente.hasMany(Workflow,           { foreignKey: 'cliente_id', as: 'workflows',  onDelete: 'CASCADE' });
Workflow.belongsTo(Cliente,         { foreignKey: 'cliente_id', as: 'cliente' });
Workflow.hasMany(Trigger,           { foreignKey: 'workflow_id', as: 'triggers',  onDelete: 'CASCADE' });
Workflow.hasMany(AcaoAutomacao,     { foreignKey: 'workflow_id', as: 'acoes',     onDelete: 'CASCADE' });
Workflow.hasMany(ExecucaoWorkflow,  { foreignKey: 'workflow_id', as: 'execucoes', onDelete: 'CASCADE' });

Trigger.belongsTo(Workflow,         { foreignKey: 'workflow_id', as: 'workflow' });

AcaoAutomacao.belongsTo(Workflow,   { foreignKey: 'workflow_id', as: 'workflow' });

ExecucaoWorkflow.belongsTo(Workflow,      { foreignKey: 'workflow_id',    as: 'workflow' });
ExecucaoWorkflow.belongsTo(Oportunidade,  { foreignKey: 'oportunidade_id', as: 'oportunidade' });
ExecucaoWorkflow.belongsTo(Tarefa,        { foreignKey: 'tarefa_id',       as: 'tarefa' });

// ── Analytics / IA associations ────────────────────────────────────────────────

Cliente.hasMany(MetricasVendas,     { foreignKey: 'cliente_id', as: 'metricasVendas',    onDelete: 'CASCADE' });
MetricasVendas.belongsTo(Cliente,   { foreignKey: 'cliente_id', as: 'cliente' });

Cliente.hasMany(AnaliseSentimento,  { foreignKey: 'cliente_id', as: 'analisesSentimento', onDelete: 'CASCADE' });
AnaliseSentimento.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
AnaliseSentimento.belongsTo(Email,   { foreignKey: 'email_id',   as: 'email' });
AnaliseSentimento.belongsTo(SMS,     { foreignKey: 'sms_id',     as: 'sms' });

Cliente.hasMany(PrevisaoIA,         { foreignKey: 'cliente_id', as: 'previsoes',  onDelete: 'CASCADE' });
PrevisaoIA.belongsTo(Cliente,       { foreignKey: 'cliente_id', as: 'cliente' });
PrevisaoIA.belongsTo(Oportunidade,  { foreignKey: 'oportunidade_id', as: 'oportunidade' });

Cliente.hasMany(RecomendacaoIA,     { foreignKey: 'cliente_id', as: 'recomendacoes',  onDelete: 'CASCADE' });
RecomendacaoIA.belongsTo(Cliente,   { foreignKey: 'cliente_id', as: 'cliente' });
RecomendacaoIA.belongsTo(Usuario,   { foreignKey: 'usuario_id', as: 'usuario' });
RecomendacaoIA.belongsTo(Oportunidade, { foreignKey: 'oportunidade_id', as: 'oportunidade' });

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
  RolePermissao,
  Plano,
  ClientePlano,
  UsoCliente,
  Usuario2FA,
  DispositivoUsuario,
  SessaoUsuario,
  AuditLog,
  DataRetentionPolicy,
  ExportacaoDados,
  EstagioPipeline,
  Oportunidade,
  HistoricoOportunidade,
  ConfiguracaoPipeline,
  Tarefa,
  CalendarioEvento,
  ConfiguracaoTarefa,
  Email,
  SMS,
  ConfiguracaoComunicacao,
  Workflow,
  Trigger,
  AcaoAutomacao,
  ExecucaoWorkflow,
  MetricasVendas,
  AnaliseSentimento,
  PrevisaoIA,
  RecomendacaoIA,
};
