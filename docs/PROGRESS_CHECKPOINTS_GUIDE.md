# SISTEMA DE CHECKPOINTS & GERENCIAMENTO DE TOKENS

**Objetivo**: Garantir que o desenvolvimento possa pausar/retomar sem perder contexto, mesmo com reset de tokens.

---

## ⚠️ IMPORTANTE - NOTA DE ESCLARECIMENTO

**Este documento contém EXEMPLOS fictícios** de como um PROGRESS.md completo se parece depois de várias semanas.

**Seu PROGRESS.md REAL:** Está em `docs/PROGRESS.md` e **SEMPRE reflete o progresso REAL** que você fez.

**Exemplo neste documento:** É para você entender o **SISTEMA**, não a realidade atual. Confira seu arquivo real para ver onde você está agora.

---

## 📋 1. COMO FUNCIONA

### 1.1 Arquivo PROGRESS.md

**Localização:** `/whatsapp-saas/PROGRESS.md`

**Propósito:** Registro único da verdade sobre:
- ✅ O que foi completado
- ⏸️ Onde o desenvolvimento parou
- 📝 Próximos passos exatos
- 🔧 Problemas pendentes
- 📦 Arquivos criados/modificados

**Atualização:** Ao final de CADA sessão de work (antes de os tokens acabarem)

---

## 📊 2. ESTRUTURA DO PROGRESS.MD

```markdown
# PROGRESS.md - WhatsApp SaaS

**Data última atualização:** [DATA]
**Tokens utilizados nesta sessão:** [X]
**Status geral:** [% completado]

---

## 📅 TIMELINE ATUALIZADA

### ✅ COMPLETADO

#### SEMANA 1 - Fundação (15-20h)
- [x] FASE 1.1 - Setup Inicial (2-3h)
  - [x] Estrutura de pastas criada
  - [x] package.json com dependências
  - [x] .gitignore pronto
  - [x] .env.example criado
  - [x] Primeiro commit no GitHub
  - **Status**: ✅ COMPLETO

- [x] FASE 1.2 - Servidor Node.js + Express (4-5h)
  - [x] server.js base criado
  - [x] Porta 3000 configurada
  - [x] Middleware CORS
  - [x] Health check implementado
  - **Status**: ✅ COMPLETO
  - **Arquivo**: src/backend/server.js
  - **Como testar**: npm start → http://localhost:3000/health

- [ ] FASE 1.3 - Autenticação JWT (4-5h) ⏸️ PARADO AQUI
  - [x] Modelo Usuario criado (partial)
  - [x] Modelo Cliente criado
  - [ ] Hash de senhas com bcrypt (TODO)
  - [ ] Rota POST /auth/login (TODO)
  - [ ] Middleware JWT (TODO)
  - [ ] Tokens com expiração (TODO)
  - **Status**: 40% COMPLETO
  - **Último commit**: "Modelos Usuario e Cliente"

### ⏸️ EM PROGRESSO

#### FASE 1.3 - Autenticação JWT Multi-Tenant
**Iniciado em:** [DATA]
**Tempo gasto:** 2-3h
**Tempo restante estimado:** 2-3h

**O que foi feito:**
```javascript
// Arquivo: src/backend/models/Usuario.js
- Modelo criado com campos: email, senha, cliente_id, role
- Validações implementadas
- Índice único em email

// Arquivo: src/backend/models/Cliente.js
- Modelo criado com campos: nome, plano, status, data_criacao
- Associação com Usuario criada
```

**O que falta fazer (PRÓXIMO PASSO):**
```javascript
// 1. Implementar bcrypt em Usuario.js
//    - Hook beforeCreate para hash de senha
//    - Método comparePassword()

// 2. Criar src/backend/services/authService.js
//    - Função register(email, senha, cliente_id)
//    - Função login(email, senha)
//    - Função validarToken(token)

// 3. Criar src/backend/middleware/auth.js
//    - Middleware verificarJWT
//    - Middleware autorizarClienteId

// 4. Criar src/backend/routes/auth.js
//    - POST /auth/register
//    - POST /auth/login
//    - GET /auth/verify

// 5. Testes
//    - curl POST register
//    - curl POST login (retorna JWT)
//    - curl com JWT inválido (401)
```

**Próximo prompt a enviar:**
[COPIAR EXATAMENTE COMO ESTÁ]

---

### 🔄 SEMANA 2 - WhatsApp + Fila

**Status**: ❌ NÃO INICIADO
**Data planejada**: [DATA]

#### FASE 2.1 - Baileys + Webhook
**Status**: ❌ NÃO INICIADO

#### FASE 2.2 - Fila + Roteamento
**Status**: ❌ NÃO INICIADO

#### FASE 2.3 - PostgreSQL + Migrations
**Status**: ❌ NÃO INICIADO

---

## 🐛 PROBLEMAS ENCONTRADOS

### Resolvidos
- [x] PostgreSQL connection string formatting (RESOLVIDO em 1.2)

### Pendentes
- [ ] Nenhum no momento

---

## 📦 ARQUIVOS CRIADOS/MODIFICADOS

**Semana 1:**
```
✅ .gitignore
✅ .env.example
✅ package.json
✅ src/backend/server.js
✅ src/backend/models/Cliente.js
✅ src/backend/models/Usuario.js (partial)
✅ database/migrations/001_create_clientes.js
✅ database/migrations/002_create_usuarios.js
✅ README.md (primeira versão)
```

**Próximos para criar:**
```
⏳ src/backend/services/authService.js
⏳ src/backend/middleware/auth.js
⏳ src/backend/routes/auth.js
⏳ src/backend/controllers/authController.js
```

---

## 🔗 COMMITS NO GITHUB

```
1. [1.1] Setup inicial - estrutura e package
2. [1.2] Servidor Express base
3. [1.3-partial] Modelos Usuario e Cliente (WIP)

Próximos:
4. [1.3] Autenticação JWT implementada
5. [2.1] Baileys integrado
...
```

---

## ⏱️ TOKENS & SESSÕES

### Sessão 1
- **Data**: [DATA]
- **Horas trabalhadas**: 2h
- **Tokens utilizados**: ~15.000
- **Tokens restantes**: ~185.000 (de 200.000)
- **Fases completadas**: 1.1, 1.2 (partial 1.3)
- **Próxima ação**: Continuar FASE 1.3 (Auth)

### Sessão 2 (PRÓXIMA)
- **Começar por**: FASE 1.3 - Autenticação JWT (continuar)
- **Tokens reservados para este arquivo**: 3.000
- **Tokens disponíveis para desenvolvimento**: ~182.000
- **Meta**: Completar FASE 1.3 até 2.1

---

## 📌 RESUMO EXECUTIVO RÁPIDO

**Para quem esqueceu o contexto:**

**Projeto**: WhatsApp SaaS multi-tenant com fila inteligente
**Clientes**: Cliente 1 (50-100 msg/dia) + Barcos (10-50 msg/dia)
**Stack**: Node.js + React + PostgreSQL + Baileys
**Timeline**: 4 semanas (4-5h/dia)
**Objetivo**: SaaS completo em produção

**Progresso**:
- 40% de FASE 1.3
- 90% da SEMANA 1
- 0% de SEMANAS 2-4

**Próximo imediato**: Completar autenticação JWT

---

## 🚀 COMANDO DE RETOMADA

**Sempre que retomar, execute:**

```bash
# 1. Atualizar repo
git pull origin main

# 2. Instalar dependências (se houver mudanças)
npm install

# 3. Verificar servidor
npm start
# Deve responder em http://localhost:3000/health

# 4. Ler contexto
cat PROGRESS.md | grep -A 50 "EM PROGRESSO"

# 5. Preparado para continuar!
```

---

## 💡 DICAS PARA PRÓXIMAS SESSÕES

1. **Sempre comece lendo PROGRESS.md** (2 min)
2. **Teste o que foi feito antes** (5 min)
3. **Copie o prompt sugerido** (1 min)
4. **Execute no Claude Code** (15-30 min)
5. **Valide código** (10 min)
6. **Commit + push GitHub** (2 min)
7. **ANTES DE ACABAR**: Atualize PROGRESS.md (5 min)

---

## ⚠️ IMPORTANTE

**Este arquivo deve ser atualizado:**
- ✅ Ao final de CADA sessão de trabalho
- ✅ Antes de os tokens acabarem
- ✅ Com detalhes específicos do que falta
- ✅ Com o próximo prompt pronto pra copiar/colar

**Nunca deixar sessão sem atualizar PROGRESS.md**

```

---

## 🧠 3. LÓGICA DE QUANDO PARAR (PARA O AGENTE)

**O agente (Claude) deve parar quando:**

```
Tokens restantes: ~10.000
│
├─ 7.000 tokens: Gerar PROGRESS.md
├─ 2.000 tokens: Resposta de confirmação
├─ 1.000 tokens: Buffer de segurança
└─ = 0 tokens disponíveis

AÇÃO: Parar e avisar
```

**Alerta que deve aparecer:**

```
⚠️ TOKENS CHEGANDO AO LIMITE

Tokens restantes: 8.000 aprox.
Tokens necessários para PROGRESS.md: 7.000
Buffer de segurança: 1.000

✅ COMPLETADO NESTA SESSÃO:
- FASE 1.2 (Servidor Express)
- Arquivos criados: 4

⏸️ PAUSANDO AQUI

📝 Atualizando PROGRESS.md...
✅ PROGRESS.md atualizado com:
- Onde parou exatamente
- Próximo prompt pronto
- Arquivos criados
- Commits feitos

🔄 PRÓXIMA SESSÃO:
Leia PROGRESS.md e execute:
"PRÓXIMO PROMPT A ENVIAR: [...]"

💾 GitHub está atualizado
✅ Pronto para retomar
```

---

## 🔄 4. FLUXO COMPLETO DE SESSÃO

### Sessão 1 (Normal)

```
1. Começa com 200.000 tokens (100%)
2. Faz FASE 1.1 (usa 5.000 tokens)
3. Faz FASE 1.2 (usa 8.000 tokens)
4. Começa FASE 1.3 (usa 6.000 tokens)
5. Detecta: tokens restantes = 10.000
6. ⚠️ AVISO: "Tokens acabando"
7. Completa tarefa atual (~6.000 tokens)
8. Tokens restantes: 4.000
9. ❌ NÃO SUFICIENTE pro PROGRESS.md (7.000)
10. Alerta: "Salvando estado antes de acabar"
11. Gera PROGRESS.md (usa 3.500 tokens)
12. Confirma: "Parado em FASE 1.3, leia PROGRESS.md"
13. Tokens zerados
```

### Sessão 2 (Retomada)

```
1. Você lê PROGRESS.md (contexto restaurado)
2. Você envia: "Continuar de onde parou"
3. Claude lê PROGRESS.md
4. Claude vê: "FASE 1.3, falta implementar bcrypt"
5. Claude vê "Próximo prompt a enviar:" 
6. Gera código completo da FASE 1.3
7. Testa
8. Commit
9. Próximo prompt: FASE 2.1
10. Ciclo continua
```

---

## 📝 5. TEMPLATE MINIMALISTA DO PROGRESS.MD

**Se ficar curto de tempo, usar template compacto:**

```markdown
# PROGRESS.md

**Última atualização**: DATA
**Status**: X% completo (Semana 1, Fase 1.3)

## ✅ COMPLETADO
- [x] 1.1 Setup
- [x] 1.2 Servidor Express
- [x] 1.3 Models Usuario/Cliente (50%)

## ⏸️ PARADO EM
FASE 1.3 - Autenticação JWT
Falta: Bcrypt + JWT service + middleware + rotas

## 📝 PRÓXIMO PROMPT
[COLAR AQUI O PROMPT EXATO]

## 📦 ARQUIVOS
- src/backend/models/Usuario.js (criado, WIP)
- src/backend/models/Cliente.js (criado)
- src/backend/server.js (criado)

## 🔗 ÚLTIMO COMMIT
[1.3-partial] Modelos Usuario e Cliente

## ⚠️ BLOQUEADORES
Nenhum

---
Atualizado às HH:MM de DD/MM
```

---

## 🎯 6. INTEGRAÇÃO COM O PLANO ORIGINAL

**No PLANO_PROJETO_WHATSAPP_SAAS.md:**

Adicionar seção:
```markdown
## ⏸️ GERENCIAMENTO DE TOKENS

Cada fase tem:
- Tempo estimado
- Tokens estimados
- Ponto de checkpoint

Quando tokens acabarem:
1. Atualize PROGRESS.md
2. Commit no GitHub
3. Próxima sessão: leia PROGRESS.md
4. Execute "Próximo prompt sugerido"
5. Continue do ponto exato
```

---

## ✅ 7. CHECKLIST FINAL DE CADA SESSÃO

**Antes de os tokens acabarem, SEMPRE fazer:**

- [ ] Código commitado no GitHub
- [ ] PROGRESS.md atualizado com:
  - [ ] O que foi completado (% exato)
  - [ ] Onde parou (fase/subfase)
  - [ ] O que falta fazer (lista específica)
  - [ ] Próximo prompt pronto (copy/paste)
  - [ ] Arquivos criados/modificados
  - [ ] Última ação de commit
- [ ] Arquivo .env.example atualizado (se houver novas variáveis)
- [ ] README.md com instruções atualizadas (se necessário)
- [ ] Nenhuma tarefa meio-feita
- [ ] Buffer de tokens ~3.000 reservados

---

## 🚀 RESUMO EXECUTIVO

**PROGRESS.md = Seu salvavidas quando tokens acabam**

**Benefícios:**
- ✅ Sem perda de contexto
- ✅ Retoma exatamente de onde parou
- ✅ Próximo prompt já está pronto
- ✅ Histórico de progresso rastreável
- ✅ Documentação viva do projeto

**Sua responsabilidade:**
- ✅ Atualizar ao final de CADA sessão
- ✅ Deixar 3.000 tokens pra PROGRESS.md
- ✅ Ser específico (não genérico)
- ✅ Incluir próximo prompt pronto

---

**Fim da documentação de Checkpoints**

**Versão:** 1.0 (Com nota clarificadora)
**Data:** 30/Junho/2026
**Status:** Guia ativo
