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

  // Departamentos: IDs vindos do seed 003
  DEPT_IDS: {
    VENDAS: 1, SUPORTE: 2, FINANCEIRO: 3, RH: 4,
    VENDAS_NAUTICA: 5, SUPORTE_NAUTICO: 6,
  },

  // Telefones únicos por cenário de teste (evita colisão de estado em memória)
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

  // Padrão para limpeza pós-teste
  TELEFONE_PATTERN: '5585990%',
};
