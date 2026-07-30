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
  Departamento,
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

  // ── 2a. RBAC: Permissões, Roles e Role_Permissões ────────────────────────────
  logSection('2a. RBAC');

  // Permissões com IDs fixos (id=5 deve ser 'fila.reabrir' — usado nos testes)
  await sequelize.query(`
    INSERT INTO permissoes (id, nome, categoria, descricao, criado_em) VALUES
      (1, 'fila.visualizar',        'fila',           'Ver fila de atendimento',         NOW()),
      (2, 'fila.responder',         'fila',           'Responder mensagens na fila',      NOW()),
      (3, 'fila.fechar',            'fila',           'Fechar tickets',                   NOW()),
      (4, 'notas.criar',            'notas',          'Criar notas em tickets',           NOW()),
      (5, 'fila.reabrir',           'fila',           'Reabrir tickets fechados',         NOW()),
      (6, 'configuracoes.permissoes','configuracoes', 'Gerenciar permissões e roles',     NOW()),
      (7, 'usuarios.gerenciar_roles','usuarios',      'Atribuir roles a usuários',        NOW())
    ON CONFLICT (id) DO NOTHING
  `);
  await sequelize.query(`SELECT setval('permissoes_id_seq', 7, true)`);
  log('✅', '7 permissões garantidas (fila, notas, configuracoes, usuarios)');

  // Roles com IDs fixos para cliente 1 (id=1..4)
  await sequelize.query(`
    INSERT INTO roles (id, nome, descricao, cliente_id, eh_customizado, criado_em) VALUES
      (1, 'admin',       'Administrador com todas as permissões',  1, false, NOW()),
      (2, 'atendente',   'Atendente com acesso à fila e notas',    1, false, NOW()),
      (3, 'vendedor',    'Vendedor com acesso limitado',           1, false, NOW()),
      (4, 'visualizador','Apenas visualização da fila',            1, false, NOW())
    ON CONFLICT (id) DO NOTHING
  `);
  await sequelize.query(`SELECT setval('roles_id_seq', 4, true)`);
  log('✅', '4 roles garantidas para cliente 1 (admin=1, atendente=2, vendedor=3, visualizador=4)');

  // Junção role_permissoes: deletar e recriar para roles 1-4
  await sequelize.query(`DELETE FROM role_permissoes WHERE role_id IN (1,2,3,4)`);
  await sequelize.query(`
    INSERT INTO role_permissoes (role_id, permissao_id, criado_em) VALUES
      (1,1,NOW()),(1,2,NOW()),(1,3,NOW()),(1,4,NOW()),(1,5,NOW()),(1,6,NOW()),(1,7,NOW()),
      (2,1,NOW()),(2,2,NOW()),(2,3,NOW()),(2,4,NOW()),
      (3,1,NOW()),(3,2,NOW()),
      (4,1,NOW())
  `);
  log('✅', 'Permissões atribuídas: admin=todas, atendente=fila+notas, vendedor=fila, visualizador=fila.visualizar');

  // ── 2b. Planos + cliente_plano ───────────────────────────────────────────────
  logSection('2b. PLANOS');

  // Usar raw SQL para garantir IDs fixos (1=Básico, 2=Profissional, 3=Enterprise)
  await sequelize.query(`
    INSERT INTO planos (id, nome, descricao, preco_mensal, usuarios_limite, mensagens_limite, departamentos_limite, features, criado_em)
    VALUES
      (1, 'Básico',        'Plano inicial para pequenos negócios',     99.90,  5,   1000,  3,  '[]',                        NOW()),
      (2, 'Profissional',  'Plano completo para médios negócios',     199.90, 20,   5000, 10,  '["crm"]',                   NOW()),
      (3, 'Enterprise',    'Plano ilimitado para grandes empresas',   499.90, 100, 50000, 50,  '["crm","ia","analytics"]',  NOW())
    ON CONFLICT (id) DO NOTHING
  `);
  // Atualizar a sequence para não conflitar em inserts futuros
  await sequelize.query(`SELECT setval('planos_id_seq', 3, true)`);

  log('✅', '3 planos garantidos (Básico id=1, Profissional id=2, Enterprise id=3)');

  // ClientePlano: associar cliente 1 ao plano Profissional (ativo)
  const [[cpExistente]] = await sequelize.query(
    `SELECT id FROM cliente_plano WHERE cliente_id = 1 AND status = 'ativo' LIMIT 1`
  );
  if (!cpExistente) {
    await sequelize.query(`
      INSERT INTO cliente_plano (cliente_id, plano_id, status, data_inicio, data_proxima_renovacao, criado_em)
      VALUES (1, 2, 'ativo', NOW(), NOW() + INTERVAL '30 days', NOW())
    `);
    log('✅', 'Cliente 1 associado ao plano Profissional');
  } else {
    log('⚠️ ', 'Cliente 1 já possui plano ativo');
  }

  // ── 2c. Tabela respostas_rapidas (criação idempotente) ───────────────────────
  logSection('2c. RESPOSTAS RÁPIDAS — tabela');

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS respostas_rapidas (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      titulo VARCHAR(100) NOT NULL,
      conteudo TEXT NOT NULL,
      atalho VARCHAR(50),
      ativo BOOLEAN NOT NULL DEFAULT true,
      criado_em TIMESTAMPTZ DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_respostas_rapidas_cliente_atalho
      ON respostas_rapidas (cliente_id, atalho) WHERE atalho IS NOT NULL
  `);
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_respostas_rapidas_cliente_id
      ON respostas_rapidas (cliente_id)
  `);
  log('✅', 'Tabela respostas_rapidas garantida');

  // Seed: 3 respostas rápidas demo para cliente 1
  const { RespostaRapida } = require('../src/backend/models');
  const respostasDemo = [
    { titulo: 'Saudação inicial',   conteudo: 'Olá {{nome}}! 👋 Como posso ajudar você hoje?', atalho: '/ola' },
    { titulo: 'Aguardar atendente', conteudo: 'Olá {{nome}}, vou verificar isso para você. Por favor, aguarde um momento! ⏳', atalho: '/aguarde' },
    { titulo: 'Encerramento',       conteudo: 'Obrigado pelo contato, {{nome}}! Seu protocolo é {{protocolo}}. Qualquer dúvida estamos à disposição. 😊', atalho: '/tchau' },
  ];
  for (const r of respostasDemo) {
    const [, criado] = await RespostaRapida.findOrCreate({
      where: { cliente_id: cliente.id, atalho: r.atalho },
      defaults: { ...r, cliente_id: cliente.id },
    });
    log(criado ? '✅' : '⚠️ ', `Resposta rápida "${r.titulo}" (${r.atalho})${criado ? ' — criada' : ' — já existia'}`);
  }

  // ── 2d. Tabela notas_internas (criação idempotente) ──────────────────────────
  logSection('2d. NOTAS INTERNAS — tabela');

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS notas_internas (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      atendimento_id UUID NOT NULL REFERENCES atendimentos(id) ON DELETE CASCADE,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      conteudo TEXT NOT NULL,
      criado_em TIMESTAMPTZ DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_notas_internas_atendimento_id
      ON notas_internas (atendimento_id)
  `);
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_notas_internas_usuario_id
      ON notas_internas (usuario_id)
  `);
  log('✅', 'Tabela notas_internas garantida');

  // ── 3. Departamentos ─────────────────────────────────────────────────────────
  logSection('3. DEPARTAMENTOS');

  const deptosData = [
    { nome: 'Vendas' },
    { nome: 'Suporte' },
    { nome: 'Administrativo' },
    { nome: 'Técnico' },
  ];

  for (const d of deptosData) {
    const [depto, criado] = await Departamento.findOrCreate({
      where: { cliente_id: cliente.id, nome: d.nome },
      defaults: { cliente_id: cliente.id, nome: d.nome, ativo: true },
    });
    log(criado ? '✅' : '⚠️ ', `Departamento "${depto.nome}" (ID: ${depto.id})${criado ? ' — criado' : ' — já existia'}`);
  }

  // ── 4. Estágios de Pipeline ──────────────────────────────────────────────────
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

  // ── 5. Oportunidades ─────────────────────────────────────────────────────────
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

  // ── 6. Tarefas ───────────────────────────────────────────────────────────────
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

  // ── 7. Resumo ────────────────────────────────────────────────────────────────
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
