'use strict';

// Seed script — creates demo data for development/staging
// Usage: node scripts/seed-data.js
// Safe to run multiple times (uses findOrCreate throughout)

require('dotenv').config();

const bcrypt = require('bcryptjs');
const {
  sequelize,
  Cliente,
  Usuario,
  EstagioPipeline,
  Oportunidade,
  Tarefa,
} = require('../src/backend/models');

const SENHA_PLAIN = 'password123';

// ─── helpers ──────────────────────────────────────────────────────────────────

function log(icon, msg) {
  console.log(`${icon}  ${msg}`);
}

function logSection(title) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(50));
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱  Iniciando seed de dados demo...\n');

  try {
    await sequelize.authenticate();
    log('✅', 'Conexão com banco estabelecida');
  } catch (err) {
    console.error('❌  Não foi possível conectar ao banco:', err.message);
    console.error('    Certifique-se de que o banco está rodando: npm run docker:up');
    process.exit(1);
  }

  // ── 1. Cliente ──────────────────────────────────────────────────────────────
  logSection('1. CLIENTE');

  const [cliente, clienteCriado] = await Cliente.findOrCreate({
    where: { nome: 'Empresa Demo 1' },
    defaults: { nome: 'Empresa Demo 1', plano: 'profissional', status: 'ativo' },
  });

  log(clienteCriado ? '✅' : '⚠️ ', `Cliente "${cliente.nome}" (ID: ${cliente.id})${clienteCriado ? ' — criado' : ' — já existia'}`);

  // ── 2. Usuários ─────────────────────────────────────────────────────────────
  logSection('2. USUÁRIOS');

  const senhaHash = await bcrypt.hash(SENHA_PLAIN, 10);

  // Usuario model role enum: 'admin' | 'atendente'
  // 'vendedor' e 'gerente' são papéis personalizados do sistema de roles (role_id),
  // mas o campo role base suporta apenas 'admin' | 'atendente'.
  const usuariosData = [
    { nome: 'João Silva',    email: 'admin@cliente1.com', role: 'admin',     label: 'admin'    },
    { nome: 'Ana Costa',     email: 'ana@cliente1.com',   role: 'atendente', label: 'vendedor' },
    { nome: 'Carlos Santos', email: 'carlos@cliente1.com', role: 'atendente', label: 'gerente' },
  ];

  const usuarios = {};

  for (const u of usuariosData) {
    const [usuario, criado] = await Usuario.findOrCreate({
      where: { email: u.email },
      defaults: {
        nome: u.nome,
        email: u.email,
        senha: senhaHash,
        cliente_id: cliente.id,
        role: u.role,
        status: 'ativo',
      },
    });
    usuarios[u.email] = usuario;
    log(
      criado ? '✅' : '⚠️ ',
      `${u.nome} <${u.email}> [${u.label}]${criado ? ' — criado' : ' — já existia'}`
    );
  }

  const ana = usuarios['ana@cliente1.com'];
  const joao = usuarios['admin@cliente1.com'];

  // ── 3. Estágios de Pipeline ──────────────────────────────────────────────────
  logSection('3. ESTÁGIOS PIPELINE');

  const estagiosData = [
    { nome: 'NOVO',        cor: '#6B7280', ordem: 1 },
    { nome: 'QUALIFICADO', cor: '#3B82F6', ordem: 2 },
    { nome: 'PROPOSTA',    cor: '#F59E0B', ordem: 3 },
    { nome: 'NEGOCIAÇÃO',  cor: '#8B5CF6', ordem: 4 },
    { nome: 'FECHADO',     cor: '#10B981', ordem: 5 },
  ];

  const estagios = {};

  for (const e of estagiosData) {
    const [estagio, criado] = await EstagioPipeline.findOrCreate({
      where: { cliente_id: cliente.id, nome: e.nome },
      defaults: { ...e, cliente_id: cliente.id, ativo: true },
    });
    estagios[e.nome] = estagio;
    log(criado ? '✅' : '⚠️ ', `Estágio "${e.nome}"${criado ? ' — criado' : ' — já existia'}`);
  }

  // ── 4. Oportunidades ─────────────────────────────────────────────────────────
  logSection('4. OPORTUNIDADES');

  // Vencimento: agosto de 2026
  const vencAgosto = new Date('2026-08-31T23:59:59Z');

  const oportunidadesData = [
    {
      titulo: 'Venda para Empresa XYZ',
      valor: 50000,
      estagio: 'NOVO',
      probabilidade: 20,
      status: 'aberta',
    },
    {
      titulo: 'Expansão ABC',
      valor: 25000,
      estagio: 'QUALIFICADO',
      probabilidade: 40,
      status: 'aberta',
    },
    {
      titulo: 'Contrato Tech Corp',
      valor: 75000,
      estagio: 'PROPOSTA',
      probabilidade: 65,
      status: 'em_andamento',
    },
    {
      titulo: 'Negociação StartUp',
      valor: 35000,
      estagio: 'NEGOCIAÇÃO',
      probabilidade: 80,
      status: 'em_andamento',
    },
  ];

  const oportunidades = [];

  for (const o of oportunidadesData) {
    const estagio = estagios[o.estagio];
    const [opor, criada] = await Oportunidade.findOrCreate({
      where: { cliente_id: cliente.id, titulo: o.titulo },
      defaults: {
        titulo: o.titulo,
        valor: o.valor,
        estagio_id: estagio.id,
        usuario_id: ana.id,
        cliente_id: cliente.id,
        probabilidade: o.probabilidade,
        status: o.status,
        data_fechamento_esperada: vencAgosto,
        descricao: `Oportunidade demo — ${o.titulo}`,
        posicao_coluna: oportunidades.length,
      },
    });
    oportunidades.push(opor);
    log(
      criada ? '✅' : '⚠️ ',
      `"${o.titulo}" — R$ ${o.valor.toLocaleString('pt-BR')} [${o.estagio}]${criada ? ' — criada' : ' — já existia'}`
    );
  }

  // ── 5. Tarefas ───────────────────────────────────────────────────────────────
  logSection('5. TAREFAS');

  // Tarefa.status enum: 'todo' | 'em_progresso' | 'concluida'
  // Tarefa.prioridade enum: 'baixa' | 'media' | 'alta' | 'critica'
  const tarefasData = [
    {
      titulo: 'Follow-up João',
      prioridade: 'alta',
      status: 'todo',
      data_vencimento: new Date('2026-07-30T18:00:00Z'),
      descricao: 'Realizar follow-up com João sobre proposta enviada',
    },
    {
      titulo: 'Preparar proposta',
      prioridade: 'alta',
      status: 'em_progresso',
      data_vencimento: new Date('2026-07-29T18:00:00Z'),
      descricao: 'Elaborar proposta comercial detalhada para Tech Corp',
    },
    {
      titulo: 'Reunião com cliente',
      prioridade: 'media',
      status: 'todo',
      data_vencimento: new Date('2026-08-10T14:00:00Z'),
      descricao: 'Agendar e conduzir reunião de alinhamento com cliente',
    },
  ];

  for (const t of tarefasData) {
    const [tarefa, criada] = await Tarefa.findOrCreate({
      where: { cliente_id: cliente.id, titulo: t.titulo },
      defaults: {
        ...t,
        cliente_id: cliente.id,
        usuario_atribuido_id: ana.id,
        usuario_criador_id: joao.id,
        posicao_coluna: 0,
      },
    });
    const venc = t.data_vencimento.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    log(
      criada ? '✅' : '⚠️ ',
      `"${t.titulo}" [${t.prioridade}/${t.status}] vence ${venc}${criada ? ' — criada' : ' — já existia'}`
    );
  }

  // ── 6. Resumo ────────────────────────────────────────────────────────────────
  logSection('CREDENCIAIS DE ACESSO');

  console.log('\n  📱  Acesse o sistema com:\n');
  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │  Admin        admin@cliente1.com            │');
  console.log('  │  Vendedor     ana@cliente1.com              │');
  console.log('  │  Gerente      carlos@cliente1.com           │');
  console.log('  │  Senha        password123                   │');
  console.log('  └─────────────────────────────────────────────┘');
  console.log('\n  🌐  Frontend: http://localhost:5173');
  console.log('  🔌  API:      http://localhost:3000/api\n');

  log('✅', 'Seed concluído com sucesso!\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Erro inesperado no seed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
