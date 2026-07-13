'use strict';

module.exports = {
  BASE_URL: process.env.TEST_URL || 'http://localhost:3000',
  TEST_TIMEOUT: 15000,

  CREDENTIALS: {
    ADMIN_C1:      { email: 'admin@cliente1.com',    senha: 'password123' },
    ATENDENTE_C1:  { email: 'ana@cliente1.com',      senha: 'password123' },
    ADMIN_C2:      { email: 'admin@barcos.com',      senha: 'password123' },
    ATENDENTE_C2:  { email: 'carlos@barcos.com',     senha: 'password123' },
  },

  CLIENTE_IDS: { C1: 1, C2: 2 },

  DEPT_IDS: {
    VENDAS: 1, SUPORTE: 2, FINANCEIRO: 3, RH: 4,
    VENDAS_NAUTICA: 5, SUPORTE_NAUTICO: 6,
  },

  // ── Telefones para testes de FILA (5585990*) ─────────────────────────
  // Limpos pelo afterEach de fila.test.js via TELEFONE_PATTERN.
  TELEFONES: {
    AUTH_1:         '5585990010001',
    AUTH_2:         '5585990010002',
    FILA_MENU:      '5585990020001',
    FILA_ESCOLHA:   '5585990020002',
    FILA_NA_FILA:   '5585990020003',
    FILA_MANUAL:    '5585990020004',
    FILA_INVALIDA:  '5585990020005',
    INT_FLOW1:      '5585990030001',
    INT_FLOW2:      '5585990030002',
    INT_PERF:       '5585990030',    // prefixo para 10 phones (+ 000..009)
    SEC_1:          '5585990040001',
    DB_1:           '5585990050001',
  },

  // ── Telefones para testes de TICKET (5585991*) ───────────────────────
  // NÃO capturados pelo TELEFONE_PATTERN. Cada describe usa afterAll próprio.
  TICKET_TELEFONES: {
    HIST:   '5585991010001',
    NOTA_1: '5585991020001',
    NOTA_2: '5585991020002',
    STATUS: '5585991030001',
    SAT:    '5585991040001',
    ISO:    '5585991050001',
  },

  // Padrão de limpeza para afterEach de fila.test.js
  TELEFONE_PATTERN: '5585990%',

  // Padrão de limpeza para afterAll dos describes de ticket
  TICKET_PATTERN: '5585991%',

  // UUIDs dos tickets seedados (seeder 006)
  SEED_TICKET_IDS: {
    T1:  '11111111-1111-4111-8111-111111111111',
    T2:  '22222222-2222-4222-8222-222222222222',
    TC2: '33333333-3333-4333-8333-333333333333',
  },
};
