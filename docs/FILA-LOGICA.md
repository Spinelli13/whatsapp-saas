# Fila de Mensagens — Lógica e Fluxo

**Fase:** 2.2 (em memória)
**Fase de migração:** 2.3 (PostgreSQL)

---

## Fluxo principal

```
[WhatsApp] → Baileys → whatsappService → filaService → resposta automática
```

1. Usuário envia mensagem pelo WhatsApp
2. Baileys recebe via `messages.upsert`
3. `whatsappService` chama `filaService.receberMensagem(clienteId, jid, texto)`
4. `filaService` decide a ação com base no estado da conversa
5. Se houver `resposta`, `whatsappService` envia de volta via `sock.sendMessage()`

---

## Estados de conversa

```
null / fechado
    ↓  (qualquer mensagem)
menu_enviado  ← bot envia menu de departamentos
    ↓  (usuário digita número)
na_fila       ← usuário entra na fila do departamento
    ↓  (atendente clica "atribuir")
atribuido     ← mensagens vão direto ao atendente
    ↓  (atendente clica "fechar")
fechado       ← próxima mensagem reinicia fluxo
```

---

## Máquina de estados detalhada

| Estado atual | Mensagem recebida | Ação | Próximo estado |
|---|---|---|---|
| `null` ou `fechado` | qualquer | envia menu | `menu_enviado` |
| `menu_enviado` | número válido (1-N) | enfileira | `na_fila` |
| `menu_enviado` | inválido | repete menu | `menu_enviado` |
| `na_fila` | qualquer | informa posição | `na_fila` |
| `atribuido` | qualquer | encaminha Socket.io | `atribuido` |

---

## Estrutura de dados em memória

### `_filas` (filaService.js)

```js
{
  "1": {               // cliente_id
    "vendas": [
      {
        id: "uuid-v4",
        clienteId: 1,
        telefone: "5585988776655@s.whatsapp.net",
        departamento: "vendas",
        texto: "1",           // o que o usuário digitou para escolher
        status: "aguardando", // aguardando | atribuido | fechado
        timestamp: "2026-07-07T10:00:00Z",
        atendente_id: null,
      }
    ],
    "suporte": [...],
  },
  "2": { ... }         // cliente_id 2 (Barcos e Barcos)
}
```

### `_estados` (filaService.js)

```js
{
  "1:5585988776655@s.whatsapp.net": {
    estado: "na_fila",
    departamento: "vendas",
    atualizadoEm: "2026-07-07T10:01:00Z",
  }
}
```

---

## Endpoints disponíveis (FASE 2.2)

Todos exigem `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/fila/departamentos/:cliente_id` | Lista departamentos |
| POST | `/api/fila/receber` | Simula mensagem entrando |
| POST | `/api/fila/escolher-departamento` | Enfileira manualmente |
| GET | `/api/fila/status/:cliente_id` | Estado da fila |
| POST | `/api/fila/atribuir` | Atribui atendente |
| POST | `/api/fila/fechar` | Fecha conversa |

---

## Eventos Socket.io emitidos

| Evento | Quando | Payload |
|--------|--------|---------|
| `fila:nova_entrada` | Usuário entra na fila | `{ telefone, departamento, posicao }` |
| `fila:atribuido` | Atendente atribuído | `{ entrada, atendente }` |
| `fila:fechado` | Conversa encerrada | `{ entrada }` |

Room: `cliente_${clienteId}` — isolamento multi-tenant.

---

## Exemplos de uso com curl

```bash
TOKEN=$(curl -s "http://localhost:3000/api/auth/mock-token?cliente_id=1" | jq -r .token)

# Listar departamentos
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/fila/departamentos/1

# Simular mensagem recebida
curl -X POST http://localhost:3000/api/fila/receber \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cliente_id":1,"telefone":"5585999990001","texto":"oi"}'
# → retorna menu de departamentos

# Simular escolha de departamento (digitar "1")
curl -X POST http://localhost:3000/api/fila/receber \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cliente_id":1,"telefone":"5585999990001","texto":"1"}'
# → retorna { acao: "enfileirado", posicao: 1 }

# Ver fila
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/fila/status/1

# Ver só vendas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/fila/status/1?departamento=vendas"

# Enfileirar manualmente
curl -X POST http://localhost:3000/api/fila/escolher-departamento \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cliente_id":1,"telefone":"5585999990002","departamento_id":"suporte"}'

# Testar isolamento cliente 2
TOKEN2=$(curl -s "http://localhost:3000/api/auth/mock-token?cliente_id=2" | jq -r .token)
curl -H "Authorization: Bearer $TOKEN2" \
  http://localhost:3000/api/fila/departamentos/2
```

---

## Como vai virar banco em FASE 2.3

### Arquivos a alterar

**`src/backend/services/filaService.js`**
- `_filas` → `SELECT/INSERT` na tabela `fila_mensagens`
- `_estados` → `SELECT/INSERT/UPDATE` na tabela `conversas`
- Funções mantêm mesma assinatura — só troca o storage

**`src/backend/services/departamentoService.js`**
- `_MOCK_DEPARTAMENTOS` → `SELECT * FROM departamentos WHERE cliente_id = :id AND ativo = true`

### Migrations necessárias (FASE 2.3)

```sql
-- 003_create_departamentos.js
CREATE TABLE departamentos (
  id         VARCHAR(50) NOT NULL,
  cliente_id INTEGER     NOT NULL REFERENCES clientes(id),
  nome       VARCHAR(100) NOT NULL,
  emoji      VARCHAR(10),
  ordem      SMALLINT DEFAULT 0,
  ativo      BOOLEAN DEFAULT true,
  PRIMARY KEY (id, cliente_id)
);

-- 004_create_conversas.js
CREATE TABLE conversas (
  id              SERIAL PRIMARY KEY,
  cliente_id      INTEGER NOT NULL REFERENCES clientes(id),
  telefone        VARCHAR(50) NOT NULL,
  estado          VARCHAR(30) NOT NULL DEFAULT 'menu_enviado',
  departamento_id VARCHAR(50),
  atualizado_em   TIMESTAMP DEFAULT NOW(),
  UNIQUE (cliente_id, telefone)
);

-- 005_create_fila_mensagens.js
CREATE TABLE fila_mensagens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      INTEGER NOT NULL REFERENCES clientes(id),
  departamento_id VARCHAR(50) NOT NULL,
  telefone        VARCHAR(50) NOT NULL,
  texto           TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'aguardando',
  atendente_id    INTEGER REFERENCES usuarios(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_fila_cliente_dept ON fila_mensagens (cliente_id, departamento_id, status);
```

---

**Status:** Em memória (FASE 2.2)
**Migrar para BD em:** FASE 2.3
