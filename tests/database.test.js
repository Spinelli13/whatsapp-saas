'use strict';

const { sequelize } = require('../src/backend/models');
const { CLIENTE_IDS } = require('./constants');

describe('Database — Estrutura de tabelas', () => {
  const EXPECTED_TABLES = [
    'clientes',
    'usuarios',
    'departamentos',
    'whatsapp_numeros',
    'fila_mensagens',
    'mensagens_automaticas',
    'sessoes_baileys',
    'atendente_departamentos',
    'nota_tickets',
    'historico_tickets',
  ];

  it.each(EXPECTED_TABLES)('tabela "%s" deve existir', async (tableName) => {
    const [rows] = await sequelize.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = :name`,
      { replacements: { name: tableName } }
    );
    expect(rows.length).toBe(1);
  });

  it('tabela de migrações sequelize deve existir', async () => {
    const [rows] = await sequelize.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'SequelizeMeta'`
    );
    expect(rows.length).toBe(1);
  });
});

describe('Database — Seeds: contagens mínimas', () => {
  it('deve ter pelo menos 2 clientes', async () => {
    const [rows] = await sequelize.query('SELECT COUNT(*) AS cnt FROM clientes');
    expect(Number(rows[0].cnt)).toBeGreaterThanOrEqual(2);
  });

  it('deve ter pelo menos 4 usuários', async () => {
    const [rows] = await sequelize.query('SELECT COUNT(*) AS cnt FROM usuarios');
    expect(Number(rows[0].cnt)).toBeGreaterThanOrEqual(4);
  });

  it('deve ter pelo menos 6 departamentos (4 C1 + 2 C2)', async () => {
    const [rows] = await sequelize.query('SELECT COUNT(*) AS cnt FROM departamentos');
    expect(Number(rows[0].cnt)).toBeGreaterThanOrEqual(6);
  });

  it('cliente 1 deve ter exatamente 4 departamentos ativos', async () => {
    const [rows] = await sequelize.query(
      'SELECT COUNT(*) AS cnt FROM departamentos WHERE cliente_id = :id AND ativo = true',
      { replacements: { id: CLIENTE_IDS.C1 } }
    );
    expect(Number(rows[0].cnt)).toBe(4);
  });

  it('cliente 2 deve ter exatamente 2 departamentos ativos', async () => {
    const [rows] = await sequelize.query(
      'SELECT COUNT(*) AS cnt FROM departamentos WHERE cliente_id = :id AND ativo = true',
      { replacements: { id: CLIENTE_IDS.C2 } }
    );
    expect(Number(rows[0].cnt)).toBe(2);
  });

  it('senhas dos usuários devem estar hasheadas (começam com $2b$)', async () => {
    const [rows] = await sequelize.query('SELECT senha FROM usuarios LIMIT 5');
    rows.forEach((row) => {
      expect(row.senha).toMatch(/^\$2[ab]\$/);
    });
  });
});

describe('Database — Integridade referencial', () => {
  it('todos os usuários devem ter cliente_id válido', async () => {
    const [rows] = await sequelize.query(`
      SELECT u.id FROM usuarios u
      LEFT JOIN clientes c ON c.id = u.cliente_id
      WHERE c.id IS NULL
    `);
    expect(rows.length).toBe(0);
  });

  it('todos os departamentos devem ter cliente_id válido', async () => {
    const [rows] = await sequelize.query(`
      SELECT d.id FROM departamentos d
      LEFT JOIN clientes c ON c.id = d.cliente_id
      WHERE c.id IS NULL
    `);
    expect(rows.length).toBe(0);
  });

  it('fila_mensagens.id deve ser UUID', async () => {
    const [rows] = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'fila_mensagens' AND column_name = 'id'
    `);
    expect(rows[0].data_type).toBe('uuid');
  });
});
