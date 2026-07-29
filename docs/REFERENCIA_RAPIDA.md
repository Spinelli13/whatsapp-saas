# REFERÊNCIA RÁPIDA - Guia de Desenvolvimento

**Use este documento para:**
- Comandos Git rápidos
- Estrutura de commits
- Padrões de código
- Troubleshooting comum
- Fluxo de sessão

---

## 🚀 INÍCIO DE SESSÃO (Sempre fazer)

```bash
# 1. Atualizar repositório
git pull origin develop

# 2. Instalar dependências (se houver novo package.json)
npm install

# 3. Verificar que tudo está OK
npm start

# Deve retornar:
# Server running on http://localhost:3000
# ✅ Health check: http://localhost:3000/health
```

---

## 📝 PADRÃO DE COMMITS

**Formato:**
```
[FASE] Descrição breve e clara

[1.1] Setup inicial - estrutura e dependências
[1.2] Servidor Express configurado
[1.3] Autenticação JWT implementada
[2.1] Baileys webhook integrado
```

**Fazer commit:**
```bash
git add .
git commit -m "[X.Y] Descrição"
git push origin develop
```

**Verificar histórico:**
```bash
git log --oneline -10
```

---

## 📂 ESTRUTURA PADRÃO DE ARQUIVOS

```
whatsapp-saas/
├── src/
│   ├── backend/
│   │   ├── config/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.js
│   └── frontend/
│       ├── admin/
│       └── cliente/
├── database/
│   ├── migrations/
│   └── seeds/
├── docs/
├── .env.example
├── .gitignore
├── package.json
├── PROGRESS.md
└── README.md
```

---

## 💻 COMANDOS ÚTEIS

### Development
```bash
# Rodar servidor
npm start

# Rodar com nodemon (reinicia ao salvar)
npm run dev

# Instalar novo pacote
npm install nome-do-pacote

# Verificar estrutura do projeto
tree -I 'node_modules'
```

### Database
```bash
# Rodar migrations
npm run migrate

# Reverter última migration
npm run migrate:undo

# Popular com seed
npm run seed
```

### Git
```bash
# Ver status
git status

# Ver commits recentes
git log --oneline -5

# Desfazer último commit (sem perder código)
git reset --soft HEAD~1

# Ver mudanças
git diff
```

### Testing
```bash
# Testar autenticação
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","senha":"123"}'

# Testar health check
curl http://localhost:3000/health

# Com variáveis de ambiente
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/conversas
```

---

## 🔐 SEGURANÇA - CHECKLIST

**Antes de cada commit:**

- [ ] Nenhuma senha em texto plano no código
- [ ] Nenhuma API key exposta
- [ ] Usar .env para variáveis sensíveis
- [ ] .env NÃO está no Git (verificar .gitignore)
- [ ] .env.example tem APENAS template (sem valores)
- [ ] Senhas são hashadas com bcrypt
- [ ] Tokens têm expiração

**Verificar:**
```bash
# Confirmar que .env não está versionado
git ls-files | grep .env

# Não deve retornar nada. Se retornar:
git rm --cached .env
git commit -m "Remove .env from git"
```

---

## 📊 PADRÃO DE CÓDIGO

### ✅ BOM
```javascript
// Nomes descritivos, código simples
const usuarioExistente = await Usuario.findOne({ where: { email } });
if (usuarioExistente) throw new Error('Email já registrado');

const senhaHasheada = await bcrypt.hash(senhaPlana, 10);
```

### ❌ RUIM
```javascript
// Comentários óbvios, nomes ruins
// Verificar email
const ue = await User.findOne({ where: { e: email } });
// Se existe, erro
if (ue) throw new Error('Erro');
// Hash
const sh = await bcrypt.hash(sp, 10);
```

### Regra simples:
**Código bem estruturado é auto-explicativo. Comentários só quando MUITO não óbvio.**

---

## 🧪 TESTES RÁPIDOS

### Fase 1.3 - Autenticação
```bash
# 1. Registrar novo usuário
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"teste@teste.com",
    "senha":"senha123",
    "cliente_id":1
  }'

# Esperado: 201 + { usuario_id, token }

# 2. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"teste@teste.com",
    "senha":"senha123"
  }'

# Esperado: 200 + { token, cliente_id }

# 3. Verificar com token inválido
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:3000/api/conversas

# Esperado: 401 Unauthorized
```

### Fase 2.1 - WhatsApp
```bash
# Verificar se Baileys está conectado
# Escanear QR no console do servidor

# Enviar mensagem pelo WhatsApp real
# Verificar se chegou no banco:
SELECT * FROM mensagens ORDER BY data_criacao DESC LIMIT 1;

# Esperado: mensagem com cliente_id correto
```

### Fase 3.1 - Socket.io
```bash
# Abrir painel em http://localhost:3000/painel
# Logar com credenciais de teste
# Enviar mensagem pelo WhatsApp
# Deve aparecer em tempo real (sem refresh)

# Verificar isolamento:
# Cliente A não vê mensagens de Cliente B
```

---

## 🚨 TROUBLESHOOTING COMUM

### "Cannot find module"
```bash
# Solução
npm install
npm start
```

### "Port 3000 already in use"
```bash
# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Connection refused - PostgreSQL"
```bash
# Verificar string de conexão
cat .env | grep DATABASE_URL

# Verificar se PostgreSQL está rodando
# Para Render: usar connection string do Render
```

### "JWT token invalid"
```bash
# Verificar variável JWT_SECRET
echo $JWT_SECRET

# Se não existir, adicionar em .env
JWT_SECRET=seu_secret_bem_seguro_aqui
```

### "CORS error"
```bash
# Adicionar origem ao CORS
// src/backend/server.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## 📋 CHECKLIST DE SESSÃO

### Antes de começar (5 min)
- [ ] Leu PROGRESS.md
- [ ] Rodou `git pull`
- [ ] Rodou `npm start` ✅
- [ ] Testou última funcionalidade

### Durante desenvolvimento
- [ ] Faz commits pequenos e frequentes
- [ ] Testa cada funcionalidade antes de próximo prompt
- [ ] Atualiza PROGRESS.md mentalmente (o que falta)

### Antes de parar (10 min)
- [ ] Código testado e funcionando
- [ ] Commit feito e pushed
- [ ] PROGRESS.md atualizado:
  - [ ] ✅ O que foi completo
  - [ ] ⏸️ Aonde parou
  - [ ] 📝 O que falta (lista)
  - [ ] 🔗 Próximo prompt (pronto)
  - [ ] 📦 Arquivos criados
  - [ ] ⏱️ Tokens utilizados

---

## 🔄 FLUXO PADRÃO DE SESSÃO

```
1. Ler PROGRESS.md (2 min)
   ↓
2. Git pull + npm install (2 min)
   ↓
3. Testar servidor (2 min)
   ↓
4. Copiar "Próximo prompt" de PROGRESS.md
   ↓
5. Executar prompt no Claude Code (15-30 min)
   ↓
6. Revisar código gerado (5 min)
   ↓
7. Testar funcionando (10 min)
   ↓
8. Fazer commit (2 min)
   ↓
9. Próximo prompt? SIM → volta ao passo 4
               NÃO → atualiza PROGRESS.md
   ↓
10. Atualizar PROGRESS.md (5 min)
    ↓
11. Commit + push (2 min)
    ↓
12. PRONTO! Próxima sessão lê PROGRESS.md
```

---

## 📱 TESTES WHATSAPP REAIS

**Como testar com seus 2 clientes:**

### Cliente 1 (Seu cliente)
```
1. Conectar número dele ao Baileys
2. Enviar mensagem: "teste"
3. Bot deve responder com menu
4. Escolher: "1" (SAC)
5. Deve entrar na fila de SAC
6. Atendente SAC vê chegando
7. Responde: "Oi! Como ajudo?"
8. Conversa rastreada
9. Histórico salvo
✅ SUCESSO
```

### Cliente 2 (Barcos)
```
1. Conectar número dele ao Baileys
2. Enviar mensagem: "oi"
3. Bot oferece menu (7 opções)
4. Escolher: "1" (Comercial)
5. Bot pergunta: "Qual produto?"
   1. Lanchas
   2. Jetski
   3. UTV
   4. Quadriciclo
6. Escolher: "1" (Lanchas)
7. Entra fila: "Comercial - Lanchas"
8. Atendente vê chegando
9. Responde
✅ SUCESSO
```

---

## 🎯 VARIÁVEIS DE AMBIENTE (.env)

**Sempre ter estas no .env:**

```env
# Servidor
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/whatsapp_saas

# JWT
JWT_SECRET=seu_secret_muito_seguro_aqui_min_32_caracteres
JWT_EXPIRES_IN=24h

# Render (depois)
RENDER_EXTERNAL_URL=https://seu-app.onrender.com

# Baileys (depois)
BAILEYS_SESSION_DIR=./sessions
```

**Template em .env.example (SEM valores):**

```env
NODE_ENV=
PORT=
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
RENDER_EXTERNAL_URL=
BAILEYS_SESSION_DIR=
```

---

## 📞 CONTATO & SUPORTE

**Se travar:**
1. Leia PROGRESS.md
2. Leia a seção "TROUBLESHOOTING" acima
3. Envie mensagem aqui descrevendo erro
4. Mostre output do `npm start`

---

## ✅ PRONTO?

Você tem agora:
- ✅ Referência rápida de comandos
- ✅ Padrões de código
- ✅ Fluxo de sessão
- ✅ Testes básicos
- ✅ Troubleshooting

**Próximo passo:** Dizer "vamos iniciar o projeto" 🚀

---

**Versão:** 1.0
**Última atualização:** Antes de iniciar
**Próxima:** Atualizar conforme progresso
