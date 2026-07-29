# 🚀 GUIA DE DEPLOY MANUAL - FASE 6.3-6.4
## Criar Contas + Fazer Deploy em Produção

**Status:** Código 100% pronto (173/173 testes)  
**Tempo estimado:** 2-3 horas  
**Resultado:** Sistema LIVE em produção! 🎉

---

## 📋 CHECKLIST ANTES DE COMEÇAR

Você deve ter:
- [ ] Commit ef0f5cb ou mais recente
- [ ] Git push feito para `main` branch no GitHub
- [ ] Conta pessoal no GitHub (já tem)
- [ ] Email válido para receber confirmações
- [ ] Domínio (opcional, pode usar subdomínio gerado)

---

## 🎯 PASSO 1: CRIAR CONTA NEON (Database)

### 1.1: Acessar Neon

```
URL: https://console.neon.tech

Clique: "Sign Up"
```

### 1.2: Criar Conta

```
1. Email: seu@email.com (pode ser pessoal)
2. Senha: qualquer senha segura
3. Nome: Seu Nome (ou empresa)
4. Clique "Continue"
5. Verificar email (link de confirmação)
6. Clique no link do email
7. Pronto! Conta criada
```

### 1.3: Criar Projeto

```
1. Dashboard aparece
2. Clique "Create Project"
3. Preencha:
   ├─ Project name: whatsapp-saas
   ├─ Database name: whatsapp_saas
   ├─ Region: us-east-1 (ou mais próximo seu)
   ├─ Postgres version: 15
   └─ Clique "Create project"
4. Aguarde 30 segundos (criando...)
```

### 1.4: Copiar Connection String

```
Projeto criado!

No dashboard:
1. Clique em "Connection Strings"
2. Copie a URL que começa com:
   postgresql://user:password@host/dbname?sslmode=require

3. Cole em um bloco de notas (vai usar depois!)
   └─ Isso é seu DATABASE_URL
```

### 1.5: Testar Conexão (opcional)

```bash
# Terminal WSL

psql "postgresql://user:password@host/dbname?sslmode=require" -c "SELECT 1"

# Deve retornar:
#  ?column?
# ----------
#        1

# Se funcionar, database OK!
```

---

## 🎯 PASSO 2: CRIAR CONTA RAILWAY (Backend)

### 2.1: Acessar Railway

```
URL: https://railway.app

Clique: "Sign up"
```

### 2.2: Criar Conta

```
Opção 1: GitHub (recomendado)
1. Clique "Continue with GitHub"
2. Autorizar Railway
3. Pronto!

Opção 2: Email
1. Email: seu@email.com
2. Senha: qualquer senha
3. Verificar email
4. Clique no link
```

### 2.3: Conectar Repositório GitHub

```
Depois de login:

1. Dashboard → "New Project"
2. Clique "Deploy from GitHub repo"
3. Selecionar seu repositório: "Spinelli13/whatsapp-saas"
4. Clique "Connect"
5. Aguarde Railway criar o projeto (~1 min)
```

### 2.4: Configurar Variáveis de Ambiente

```
Railway vai criar serviço automaticamente!

MAS precisa de variáveis:

1. No projeto Railway:
2. Clique em "Service" → seu projeto
3. Clique em "Variables"
4. Adicione as variáveis do arquivo .env.production.example:

DATABASE_URL=[Cole a URL do Neon aqui - PASSO 1.4]
JWT_SECRET=[Gere valor aleatório de 32 chars - veja abaixo]
JWT_REFRESH_SECRET=[Gere valor aleatório de 32 chars]
NODE_ENV=production
PORT=3000
ENCRYPTION_KEY=[Gere valor aleatório de 32 chars]

# Para gerar valores aleatórios no terminal:
openssl rand -base64 32

# Copie saída 3 vezes (JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY)

Depois de adicionar TODAS as variáveis:
Clique "Save"
```

### 2.5: Verificar Procfile

```
Railroad vai ler o Procfile automaticamente!

Procfile contém:
web: npm start
release: npm run db:migrate:prod

Isso significa:
- "release": vai rodar migrations automaticamente no deploy
- "web": vai iniciar o servidor
```

### 2.6: Primeiro Deploy

```
Depois que salvar variáveis:

1. Vá em "Deployments"
2. Deve haver deploy "Building..." ou "In Progress"
3. Aguarde completar (~5 min)

Se der erro:
- Clique em deployment
- Ver "Build Logs"
- Procurar por error message
- Verificar variáveis (DATABASE_URL correta?)

Se der sucesso:
- Ver "Deployment Successful"
- Vai ter URL como: seu-projeto.up.railway.app
```

### 2.7: Testar Backend

```bash
# Terminal (qualquer lugar)

curl https://seu-projeto.up.railway.app/health

# Deve retornar:
# {
#   "status": "ok",
#   "uptime": 123.45,
#   "environment": "production",
#   "version": "1.0.0"
# }

# Se funcionar, backend OK!
```

---

## 🎯 PASSO 3: CRIAR CONTA VERCEL (Frontend)

### 3.1: Acessar Vercel

```
URL: https://vercel.com

Clique: "Sign Up"
```

### 3.2: Criar Conta (GitHub)

```
1. Clique "Continue with GitHub"
2. Autorizar Vercel
3. Pronto!
```

### 3.3: Importar Projeto

```
Depois de login:

1. Clique "Add New..." → "Project"
2. Clique "Import Git Repository"
3. Paste: https://github.com/Spinelli13/whatsapp-saas
4. Clique "Import"
```

### 3.4: Configurar Build

```
Vercel vai pedir configurações:

1. Framework: "Vite"
2. Root Directory: "./" (deixar padrão)
3. Build Command: "npm run build --prefix src/frontend"
4. Output Directory: "src/frontend/dist"
5. Install Command: "pnpm install" (deixar)
```

### 3.5: Adicionar Environment Variables

```
Antes de fazer deploy:

1. Em "Environment Variables":
2. Adicione:
   ├─ VITE_API_URL = https://seu-projeto.up.railway.app
   ├─ VITE_SOCKET_URL = https://seu-projeto.up.railway.app
   └─ (optional) VITE_SENTRY_DSN = (deixar em branco por agora)

3. Clique "Deploy"
```

### 3.6: Primeiro Deploy

```
Vercel vai fazer build automaticamente (~2 min)

Se der erro:
- Clique em "Deployments"
- Ver "Build logs"
- Procurar error
- Comum: node_modules issue
  └─ Solução: Limpar cache e rebuildar

Se der sucesso:
- Ver URL: seu-projeto.vercel.app
- Clique para abrir
- Deve ver página de login do CRM
```

### 3.7: Testar Frontend

```
1. Abra: https://seu-projeto.vercel.app
2. Veja página de login
3. Tente fazer login:
   Email: admin@cliente1.com (credencial de teste)
   Senha: password123
4. Se login funcionar, frontend OK!
```

---

## 🎯 PASSO 4: CRIAR CONTA SENDGRID (Emails)

### 4.1: Acessar SendGrid

```
URL: https://sendgrid.com

Clique: "Sign Up Free"
```

### 4.2: Criar Conta

```
1. Email: seu@email.com
2. Senha: qualquer senha
3. Nome: seu nome
4. Empresa: sua empresa
5. Clique "Create Account"
6. Verificar email (link de confirmação)
```

### 4.3: Criar API Key

```
Dashboard:

1. Vá em "Settings" → "API Keys"
2. Clique "Create API Key"
3. Name: "CRM Production"
4. Select Full Access
5. Clique "Create & Save"
6. Copie a chave (aparece uma única vez!)
   ├─ Começa com: SG.
   └─ Cola em bloco de notas!
```

### 4.4: Verificar Sender Email

```
IMPORTANTE: SendGrid bloqueia emails de senders não verificados!

1. Vá em "Settings" → "Sender Authentication"
2. Clique "Verify a Single Sender"
3. Preencha:
   ├─ From Email: noreply@seu-crm.com
   ├─ From Name: WhatsApp SaaS CRM
   ├─ Reply To: suporte@seu-crm.com
   └─ Clique "Create"
4. SendGrid envia email de confirmação
5. Clique no link do email
6. Pronto! Sender verificado
```

### 4.5: Atualizar Railway

```
Agora adicione ao Railway:

1. Railway → seu projeto → Variables
2. Adicione:
   ├─ SENDGRID_API_KEY = SG.sua_chave_aqui
   └─ SENDGRID_FROM_EMAIL = noreply@seu-crm.com
3. Clique "Save"
4. Railway vai redeploy automaticamente
```

---

## 🎯 PASSO 5: CRIAR CONTA SENTRY (Monitoring)

### 5.1: Acessar Sentry

```
URL: https://sentry.io

Clique: "Sign Up"
```

### 5.2: Criar Conta

```
1. Email: seu@email.com
2. Clique "Continue with GitHub" (mais fácil)
3. Autorizar Sentry
4. Pronto!
```

### 5.3: Criar Projeto

```
Dashboard:

1. Clique "Projects" → "Create Project"
2. Platform: "Node.js"
3. Alert on every new issue: ✓ (deixar)
4. Clique "Create Project"
```

### 5.4: Copiar DSN

```
Projeto criado!

Vai abrir página com instruções.

Procure por: "DSN"

Copia toda a URL:
└─ https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

Cola em bloco de notas!
```

### 5.5: Criar Segundo Projeto (Frontend)

```
Sentry pode ter projetos separados para backend + frontend.

OPCIONAL: Você pode usar mesmo DSN para ambos.

Se quiser separado:

1. Clique "Projects" → "Create Project"
2. Platform: "React"
3. Repita processo
4. Copiar DSN do React também
```

### 5.6: Atualizar Railway + Vercel

```
Railway (Backend):

1. Railway → Variables
2. Adicione:
   ├─ SENTRY_DSN = https://xxxxx@sentry.io/xxxxx
   └─ SENTRY_ENVIRONMENT = production
3. Clique "Save"
4. Railway vai redeploy

Vercel (Frontend):

1. Vercel → seu projeto → Settings → Environment Variables
2. Adicione:
   ├─ VITE_SENTRY_DSN = https://xxxxx@sentry.io/xxxxx (pode usar mesmo do backend)
   └─ (opcional) VITE_SENTRY_ENVIRONMENT = production
3. Clique "Save and Redeploy"
```

---

## 🎯 PASSO 6: CONFIGURAR DOMÍNIO (Opcional)

### 6.1: Você já tem domínio?

```
Opção A: SIM, já tenho domínio
├─ Ir para PASSO 6.2

Opção B: NÃO, quero usar subdomínio gerado
├─ Pular para PASSO 7 (usar URLs geradas)
└─ Domínios você configura depois se quiser
```

### 6.2: Conectar Domínio no Vercel

```
Vercel Dashboard:

1. Seu projeto → Settings → Domains
2. Adicione seu domínio: seu-crm.com
3. Vercel vai fornecer CNAME:
   ├─ Cname name: seu-crm.com
   └─ Cname value: cname.vercel-dns.com
```

### 6.3: Conectar Domínio no Railway

```
Para API backend:

1. Railway → seu projeto → Settings → Plugins
2. Procure por "Custom Domain" (se tiver)
3. OU use URL Railway gerada: seu-projeto.up.railway.app

Depois:
1. Vá em seu registrador de domínio (ex: GoDaddy, NameCheap)
2. Zone/DNS Settings
3. Adicione CNAME:
   ├─ Name: api
   ├─ Value: seu-projeto.up.railway.app
   └─ Save

4. Aguarde 15 min - 24h para DNS propagar
```

### 6.4: Atualizar URLs

```
Se configurou domínio:

Railway → Variables:
├─ VITE_API_URL = https://api.seu-crm.com
└─ VITE_SOCKET_URL = https://api.seu-crm.com

Vercel: redeploy com novo domínio
```

---

## ✅ PASSO 7: TESTAR TUDO EM PRODUÇÃO

### 7.1: Verificar Health Checks

```bash
# Terminal

# Backend health
curl https://seu-projeto.up.railway.app/health
# Esperado: { status: 'ok', ... }

# Backend ready
curl https://seu-projeto.up.railway.app/health/ready
# Esperado: { status: 'ready', database: 'connected' }

# Frontend
open https://seu-projeto.vercel.app
# Deve ver página de login
```

### 7.2: Testar Login

```
1. Abra: https://seu-projeto.vercel.app
2. Email: admin@cliente1.com
3. Senha: password123
4. Clique "Entrar"
5. Se funcionar:
   ├─ Dashboard aparece ✓
   ├─ Significa: frontend + backend + database funcionando!
   └─ SUCESSO!
```

### 7.3: Testar 2FA (se quiser)

```
1. Ir em "Configurações" → "Segurança"
2. Clique "Configurar Authenticator"
3. Escaneia QR code
4. Digita código do Authenticator
5. Se funcionar: 2FA OK!
```

### 7.4: Testar WhatsApp (se quiser)

```
1. Ir em "Cliente"
2. Clique "Conectar WhatsApp"
3. Escaneia QR code com celular
4. Se conectar: WhatsApp OK!
```

### 7.5: Ver Erros em Sentry (se quiser)

```
1. Ir em Sentry: https://sentry.io
2. Clique seu projeto
3. Ver "Issues" (deve estar vazio se tudo ok)
4. Se tiver erro, clicar para ver detalhes
```

---

## 🎯 PASSO 8: CONFIGURAR GITHUB SECRETS (CI/CD Automático)

### 8.1: Adicionar Secrets para Auto-Deploy

```
GitHub:

1. Seu repo → Settings → Secrets and variables → Actions
2. New secret:
   ├─ Name: RAILWAY_TOKEN
   ├─ Value: [obter do Railway abaixo]
   └─ Clique "Add secret"

3. New secret:
   ├─ Name: VERCEL_TOKEN
   ├─ Value: [obter do Vercel abaixo]
   └─ Clique "Add secret"
```

### 8.2: Obter Railway Token

```
Railway:

1. Vá em seu avatar (canto superior direito)
2. Settings → Tokens
3. Clique "Create New Token"
4. Copy o token
5. Cola no GitHub secret RAILWAY_TOKEN
```

### 8.3: Obter Vercel Token

```
Vercel:

1. Settings → Tokens
2. Clique "Create Token"
3. Name: GitHub CI/CD
4. Copy token
5. Cola no GitHub secret VERCEL_TOKEN
```

### 8.4: Próximo Push Faz Deploy

```
Agora quando você faz:

git push origin main

GitHub Actions:
1. Roda testes
2. Build Docker
3. Deploy para Railway (backend)
4. Deploy para Vercel (frontend)

Tudo automático! 🎉
```

---

## 🎉 CHECKLIST FINAL

```
Contas criadas:
☑ Neon PostgreSQL (DATABASE_URL obtida)
☑ Railway Backend (variáveis configuradas)
☑ Vercel Frontend (VITE_API_URL configurado)
☑ SendGrid (API Key + sender verificado)
☑ Sentry (DSN obtida)

Variáveis configuradas:
☑ DATABASE_URL em Railway
☑ JWT_SECRET em Railway
☑ JWT_REFRESH_SECRET em Railway
☑ ENCRYPTION_KEY em Railway
☑ SENDGRID_API_KEY em Railway
☑ SENTRY_DSN em Railway + Vercel
☑ VITE_API_URL em Vercel

Testes em produção:
☑ GET /health retorna ok
☑ GET /health/ready conecta ao database
☑ Frontend carrega (sua-projeto.vercel.app)
☑ Login funciona
☑ 2FA funciona (opcional)
☑ WhatsApp conecta (opcional)
☑ Sentry recebe eventos (opcional)

CI/CD:
☑ GitHub Secrets configurados
☑ Próximo push faz deploy automático

RESULTADO: SISTEMA LIVE EM PRODUÇÃO! 🚀
```

---

## 📊 URLs FINAIS

```
Frontend (Cliente acessa aqui):
https://seu-projeto.vercel.app

Backend API:
https://seu-projeto.up.railway.app

Database:
Via Neon console (não acesso direto cliente)

Monitoring:
https://sentry.io/organizations/seu-org/issues/

Email logs:
https://app.sendgrid.com/
```

---

## 🆘 TROUBLESHOOTING

### Erro: "database connection failed"

```
1. Verificar DATABASE_URL em Railway
2. Copiar exata URL do Neon (com senha!)
3. Testar localmente:
   psql $DATABASE_URL -c "SELECT 1"
4. Se falhar, verificar IP em Neon console
```

### Erro: "SendGrid authentication failed"

```
1. Verificar SENDGRID_API_KEY em Railway
2. Verificar que começa com "SG."
3. Verificar sender email verificado em SendGrid
4. Tentar resend email test
```

### Erro: "Sentry DSN invalid"

```
1. Verificar SENTRY_DSN é URL completa
2. Copiar exata do Sentry (https://...)
3. Se vazio, Sentry desativa (não quebra app)
```

### Frontend não conecta backend

```
1. Verificar VITE_API_URL em Vercel:
   - Deve ser URL do Railway: https://seu-projeto.up.railway.app
   - NÃO localhost!
2. Redeploy no Vercel
3. Limpar cache browser (Ctrl+Shift+Delete)
4. Testar incognito
```

---

## 🎊 PARABÉNS!

Você terminou de fazer deploy do seu **WhatsApp SaaS CRM**!

**Próximas ações opcionais:**
- [ ] Configurar domínio próprio
- [ ] Criar usuários para clientes reais
- [ ] Conectar WhatsApp real
- [ ] Fazer testes com clientes
- [ ] Iterações/melhorias

**Sistema pronto para vender!** 🚀

---

**Tempo total do projeto:** ~40-50 horas  
**Fases completas:** 12/12 (100%)  
**Testes:** 173/173 passando  
**Status:** PRODUCTION READY ✅
