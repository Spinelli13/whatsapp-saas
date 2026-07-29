# ⚠️ MOCK AUTH TEMPORÁRIO — REMOVER NA FASE 2.3

**Criado em:** 30/Junho/2026
**Remover em:** FASE 2.3 (quando PostgreSQL estiver integrado)
**Responsável:** Spinelli13

---

## O que é o MOCK?

Usuários fictícios em memória que permitem testar a autenticação JWT e os
endpoints do WhatsApp **sem precisar de PostgreSQL**.

Quando o banco estiver pronto (Fase 2.3), todo esse código some e o login
real com banco assume o lugar.

---

## Onde está o MOCK? (linhas exatas)

### 1. `src/backend/services/authService.js`

| Linhas | O que é |
|--------|---------|
| 15–43 | `const MOCK_USERS = [...]` — 3 usuários fictícios em memória |
| 120–142 | `async function loginMock()` — login sem banco |
| 147–169 | `function getMockToken()` — token sem senha para curl/browser |

### 2. `src/backend/routes/auth.js`

| Linhas | O que é |
|--------|---------|
| 51–64 | `POST /api/auth/login-mock` — rota de login mock |
| 69–77 | `GET /api/auth/mock-token` — rota de token rápido |

---

## Quando remover?

**FASE 2.3** — após:
- PostgreSQL configurado e migrations rodadas
- Tabelas `clientes` e `usuarios` populadas via seed
- `POST /api/auth/login` testado com banco real e retornando JWT
- `POST /api/auth/register` criando usuários no banco

---

## Como remover — passo a passo

### Passo 1 — Deletar de `src/backend/services/authService.js`

Remover o bloco inteiro marcado com `// MOCK - REMOVER EM 2.3`:

```js
// Deletar este bloco completo (linhas 9–37):
const MOCK_USERS = [ ... ]

// Deletar esta função (linhas 103–121):
async function loginMock({ email, senha }) { ... }

// Deletar esta função (linhas 123–143):
function getMockToken(clienteId = 1) { ... }
```

Atualizar o `module.exports` no final do arquivo:

```js
// Antes (com mock):
module.exports = { register, login, loginMock, getMockToken, validarToken };

// Depois (sem mock):
module.exports = { register, login, validarToken };
```

### Passo 2 — Deletar de `src/backend/routes/auth.js`

Remover o import de `loginMock` e `getMockToken`:

```js
// Antes:
const { register, login, loginMock, getMockToken } = require('../services/authService');

// Depois:
const { register, login } = require('../services/authService');
```

Deletar as duas rotas mock (e os comentários ao redor):

```js
// Deletar completamente:
router.post('/login-mock', async (req, res, next) => { ... });
router.get('/mock-token', (req, res, next) => { ... });
```

### Passo 3 — Verificar que nada mais referencia mock

```bash
grep -r "mock" src/backend/ --include="*.js" -i
# Não deve retornar nada após a limpeza
```

### Passo 4 — Testar com banco real

```bash
# Login real (com PostgreSQL)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@suaempresa.com","senha":"suasenha"}'
# Deve retornar { token, usuario } sem "mock: true"

# Verificar token
TOKEN=<token retornado>
curl http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"
# Deve retornar { valido: true, usuario: { cliente_id: X, ... } }

# WhatsApp com token real
curl -X POST http://localhost:3000/api/whatsapp/conectar/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Checklist de validação pós-remoção

Execute cada item e confirme ✅:

- [ ] `GET /api/auth/mock-token` retorna **404** (rota não existe mais)
- [ ] `POST /api/auth/login-mock` retorna **404** (rota não existe mais)
- [ ] `POST /api/auth/login` retorna **200 + JWT** com usuário do banco
- [ ] `GET /api/auth/verify` com token real retorna **200**
- [ ] `POST /api/whatsapp/conectar/1` aceita token real
- [ ] `grep -r "MOCK" src/backend/` não retorna nada
- [ ] `grep -r "loginMock\|getMockToken\|MOCK_USERS" src/backend/` não retorna nada
- [ ] Nenhum `console.log` ou comentário "// MOCK" restante

---

## Usuários mock disponíveis AGORA (enquanto FASE 2.3 não chega)

Senha de todos: `password`

| Email | Role | cliente_id | Uso |
|-------|------|-----------|-----|
| admin@cliente1.com | admin | 1 | Admin do cliente principal |
| atendente@cliente1.com | atendente | 1 | Atendente do cliente principal |
| admin@barcos.com | admin | 2 | Admin Barcos e Barcos |

### Como obter token rapidamente (curl/browser):

```bash
# Token para cliente 1 (sem senha)
curl http://localhost:3000/api/auth/mock-token?cliente_id=1

# Token para cliente 2 (Barcos)
curl http://localhost:3000/api/auth/mock-token?cliente_id=2

# Com email+senha
curl -X POST http://localhost:3000/api/auth/login-mock \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cliente1.com","senha":"password"}'
```

---

**Status:** ATIVO (mock em uso)
**Próxima ação:** Remover após Fase 2.3 completar PostgreSQL
