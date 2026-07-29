# Guia de Testes — WhatsApp SaaS

## Pré-requisitos

```bash
# 1. Subir o banco via Docker
npm run docker:up

# 2. Rodar migrations e seeds
npm run db:migrate
npm run db:seed

# 3. Instalar dependências de dev (jest + supertest)
npm install --save-dev jest supertest
```

## Rodar os testes

```bash
# Todos os testes (com relatório de cobertura)
npm test

# Apenas um arquivo
npx jest tests/auth.test.js --verbose

# Modo watch (re-executa ao salvar)
npm run test:watch

# Relatório de cobertura HTML
npm run test:coverage
# → abrir coverage/lcov-report/index.html
```

## Estrutura dos testes

```
tests/
├── globalSetup.js          # verifica conexão com o banco (roda 1x antes de tudo)
├── constants.js            # credenciais, IDs de cliente/depto, telefones de teste
├── helpers/
│   └── auth.helper.js      # loginUser(), authHeaders()
├── auth.test.js            # 11 testes — login, token JWT, verify
├── fila.test.js            # 9 testes  — departamentos, menu, enfileiramento, status
├── integration.test.js     # 3 fluxos  — fluxo completo C1, isolação C2, performance FIFO
├── security.test.js        # 10 testes — 401/403, token expirado, SQL injection
└── database.test.js        # 10 testes — 8 tabelas existem, seeds, integridade referencial
```

## Thresholds de cobertura (jest.config.js)

| Métrica    | Mínimo |
|------------|--------|
| Statements | 70%    |
| Branches   | 60%    |
| Functions  | 75%    |
| Lines      | 70%    |

Se a cobertura cair abaixo do threshold, `npm test` sai com código de erro.

## Convenções

### Telefones únicos por cenário

Cada cenário usa um `telefone` único (definido em `constants.TELEFONES`) para evitar colisão
no mapa `_estados` em memória do `filaService`:

```js
// constants.js
TELEFONES: {
  FILA_MENU:    '5585990020001',  // só para o teste de menu
  FILA_ESCOLHA: '5585990020002',  // só para o teste de escolha de depto
  ...
}
```

### Limpeza pós-teste

Todo arquivo com testes de fila usa `afterEach` para limpar `fila_mensagens`:

```js
afterEach(async () => {
  await sequelize.query(
    `DELETE FROM fila_mensagens WHERE telefone LIKE :pattern`,
    { replacements: { pattern: TELEFONE_PATTERN } }  // '5585990%'
  );
});
```

### Adicionar novos testes

1. Escolha um telefone exclusivo em `constants.TELEFONES` (ou adicione um novo).
2. Use `authHeaders(token)` para autenticação em rotas protegidas.
3. Em testes de fila, adicione `afterEach` com limpeza.
4. Execute `npx jest tests/seu-arquivo.test.js --verbose` antes de commitar.

## CI/CD

Adicionar no pipeline (GitHub Actions / GitLab CI):

```yaml
test:
  services:
    - postgres:15-alpine
  environment:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/whatsapp_saas
    JWT_SECRET: ci_secret
    NODE_ENV: test
  script:
    - npm ci
    - npm run db:migrate
    - npm run db:seed
    - npm test
```

## Troubleshooting

| Erro | Causa | Solução |
|------|-------|---------|
| `✗ Banco de dados inacessível` | Docker não está rodando | `npm run docker:up` |
| `Jest did not exit after 5 seconds` | Pool Sequelize aberto | Já resolvido com `--forceExit` |
| `EADDRINUSE 3000` | Servidor antigo rodando | `npx kill-port 3000` |
| `relation "fila_mensagens" does not exist` | Migration não rodou | `npm run db:migrate` |
| `password authentication failed` | Credencial errada no `.env` | Verificar `DB_PASSWORD` |
