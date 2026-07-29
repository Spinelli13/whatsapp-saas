# 📋 CRONOGRAMA COMPLETO - SEMANA 5-6
## Código + Testes + Infraestrutura + Operacional

**Objetivo:** Deixar o CRM 100% PRONTO para cliente usar (inclui contas, configurações, procedimentos)  
**Data:** 15-17/Julho/2026  
**Resultado:** Sistema em produção com custo ZERO

---

## 🎯 SEMANA 5 - SEGURANÇA + LGPD (10-12 horas)

### FASE 5.1: Autenticação Avançada (4-5 horas)

#### Parte A: CÓDIGO (2-3h)
```
FASE 5.1A - Código 2FA + Social Login

O QUE FAZ:
├─ 2FA via SMS (Twilio mock)
├─ 2FA via Authenticator (TOTP)
├─ Social Login Google OAuth2
├─ Social Login Microsoft OAuth2
├─ Session management
└─ Device management

Testes: +20 testes

ENTREGA:
├─ Código completo
├─ 220/220 testes ✅
└─ Pronto para integração
```

#### Parte B: INFRAESTRUTURA (1-2h)

##### 1. TWILIO (SMS Mock para 2FA)

```
🌐 SITE: https://www.twilio.com

PASSO A PASSO:

1️⃣ CRIAR CONTA:
   URL: https://www.twilio.com/try-twilio
   ├─ Email pessoal
   ├─ Senha
   ├─ Verificar email
   └─ Dados básicos

2️⃣ DASHBOARD TWILIO:
   URL: https://console.twilio.com/
   
   PASSO A PASSO:
   ├─ Menu esquerdo → "Account"
   ├─ Copiar: Account SID
   ├─ Copiar: Auth Token
   └─ Guardar em anotação

3️⃣ INTEGRAR NO CÓDIGO:

   ARQUIVO: src/backend/config/twilio.js
   
   const twilio = require('twilio');
   
   const client = twilio(
     process.env.TWILIO_ACCOUNT_SID,
     process.env.TWILIO_AUTH_TOKEN
   );
   
   module.exports = client;

4️⃣ .ENV ARQUIVO:

   ARQUIVO: .env
   
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890

5️⃣ PARA DEV (MOCK):

   ARQUIVO: src/backend/services/authService.js
   
   // Para desenvolvimento, simular SMS ao invés de enviar
   static async enviarSMS2FA(numeroTelefone) {
     const codigo = Math.random().toString().slice(2, 8); // 6 dígitos
     
     if (process.env.NODE_ENV === 'development') {
       console.log(`[MOCK SMS] Enviando para ${numeroTelefone}: ${codigo}`);
       // Guardar código na sessão/cache
       return { codigo, enviado: true };
     }
     
     // Em produção, usar Twilio real
     await client.messages.create({
       body: `Seu código 2FA: ${codigo}`,
       from: process.env.TWILIO_PHONE_NUMBER,
       to: numeroTelefone
     });
     
     return { codigo, enviado: true };
   }

6️⃣ CUSTO:
   ├─ Trial: $15 crédito inicial
   ├─ Depois: $0.01 por SMS
   ├─ Para 2 clientes: ~$2-5/mês máximo
   └─ Agora: $0 (usar trial)
```

##### 2. GOOGLE OAUTH (Social Login)

```
🌐 SITE: https://console.cloud.google.com

PASSO A PASSO:

1️⃣ CRIAR PROJETO:
   URL: https://console.cloud.google.com/
   
   ├─ Clique "Select a Project"
   ├─ Clique "NEW PROJECT"
   ├─ Nome: "WhatsApp SaaS CRM"
   ├─ Criar → Aguardar
   └─ Depois clique no projeto

2️⃣ HABILITAR GOOGLE+ API:
   
   ├─ Menu esquerdo → "APIs & Services"
   ├─ "Library"
   ├─ Buscar: "Google+ API"
   ├─ Clique → "ENABLE"
   └─ Aguardar

3️⃣ CRIAR CREDENCIAIS OAuth2:
   
   ├─ Menu esquerdo → "Credentials"
   ├─ Clique "Create Credentials"
   ├─ Tipo: "OAuth client ID"
   ├─ Primeiro setup: "Configure OAuth consent screen"
   ├─ User Type: "External"
   ├─ Preencher:
   │  ├─ App name: "WhatsApp SaaS CRM"
   │  ├─ User support email: seu@email.com
   │  └─ Developer contact: seu@email.com
   ├─ Salvar
   ├─ Voltar a "Credentials"
   ├─ "Create Credentials" → "OAuth client ID"
   ├─ Application type: "Web application"
   ├─ Name: "CRM Frontend"
   ├─ Authorized JavaScript origins:
   │  ├─ http://localhost:5173 (DEV)
   │  └─ https://seu-crm.com (PRODUÇÃO - depois)
   ├─ Authorized redirect URIs:
   │  ├─ http://localhost:5173/auth/google/callback (DEV)
   │  └─ https://seu-crm.com/auth/google/callback (PRODUÇÃO)
   └─ Criar

4️⃣ COPIAR CREDENCIAIS:
   
   ├─ Google Client ID: xxxxxxx.apps.googleusercontent.com
   ├─ Google Client Secret: xxxxxxxxxxxxxxxx
   └─ Guardar em anotação

5️⃣ INTEGRAR NO CÓDIGO:

   ARQUIVO: src/backend/routes/auth.js
   
   const passport = require('passport');
   const GoogleStrategy = require('passport-google-oauth20').Strategy;
   
   passport.use(new GoogleStrategy({
     clientID: process.env.GOOGLE_CLIENT_ID,
     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
     callbackURL: "/api/auth/google/callback"
   },
   async (accessToken, refreshToken, profile, done) => {
     // Lógica de criar/atualizar usuário
     const usuario = await Usuario.findOrCreate({
       where: { email: profile.emails[0].value }
     });
     return done(null, usuario);
   }));

6️⃣ .ENV ARQUIVO:

   GOOGLE_CLIENT_ID=xxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxx

7️⃣ FRONTEND:

   ARQUIVO: src/frontend/src/components/auth/SocialLogin.tsx
   
   const handleGoogleLogin = async () => {
     window.location.href = 'http://localhost:3000/api/auth/google';
   };

8️⃣ CUSTO:
   └─ Grátis! ✅
```

##### 3. MICROSOFT OAUTH (Social Login)

```
🌐 SITE: https://portal.azure.com

PASSO A PASSO:

1️⃣ CRIAR TENANT (se não tiver):
   URL: https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-create-new-tenant
   
   ├─ Ir para https://portal.azure.com
   ├─ "Azure Active Directory"
   ├─ "Create a tenant"
   └─ Seguir instruções

2️⃣ REGISTRAR APLICAÇÃO:
   
   URL: https://portal.azure.com → "App registrations"
   
   ├─ "New registration"
   ├─ Name: "WhatsApp SaaS CRM"
   ├─ Supported account types: "Accounts in any organizational directory"
   ├─ Redirect URI (Web): http://localhost:3000/api/auth/microsoft/callback
   └─ Register

3️⃣ COPIAR CREDENCIAIS:
   
   ├─ Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ├─ Directory (tenant) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   └─ Guardar em anotação

4️⃣ CRIAR CLIENT SECRET:
   
   ├─ "Certificates & secrets"
   ├─ "New client secret"
   ├─ Description: "CRM"
   ├─ Expires: "24 months"
   ├─ Clique "Add"
   ├─ Copiar: Value (só aparece uma vez!)
   └─ Guardar em anotação

5️⃣ INTEGRAR NO CÓDIGO:

   ARQUIVO: src/backend/routes/auth.js
   
   const MicrosoftStrategy = require('passport-microsoft').Strategy;
   
   passport.use(new MicrosoftStrategy({
     clientID: process.env.MICROSOFT_CLIENT_ID,
     clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
     callbackURL: "/api/auth/microsoft/callback",
     tenant: process.env.MICROSOFT_TENANT_ID
   },
   async (accessToken, refreshToken, profile, done) => {
     const usuario = await Usuario.findOrCreate({
       where: { email: profile.emails[0].value }
     });
     return done(null, usuario);
   }));

6️⃣ .ENV ARQUIVO:

   MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   MICROSOFT_CLIENT_SECRET=xxxxxxxxxxxxxxxx
   MICROSOFT_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

7️⃣ CUSTO:
   └─ Grátis! ✅
```

---

### FASE 5.2: LGPD + Criptografia (5-6 horas)

#### Parte A: CÓDIGO (3-4h)
```
FASE 5.2A - Código LGPD + Criptografia

O QUE FAZ:
├─ AES-256 encryption dados sensíveis
├─ Right to be forgotten (GDPR/LGPD)
├─ Data portability (exportar dados)
├─ Audit trail completo
├─ Backup automático
└─ Data retention policy

Testes: +20 testes

ENTREGA:
├─ Código completo
├─ 240/240 testes ✅
└─ LGPD compliant
```

#### Parte B: INFRAESTRUTURA (2-3h)

##### 1. BACKUP AUTOMÁTICO (Neon)

```
NEON já faz automático!

Verificar configuração:
├─ URL: https://console.neon.tech
├─ Login
├─ Projeto → Settings
├─ "Backups" tab
├─ Verificar:
│  ├─ Backups habilitados ✓
│  ├─ Retenção de 7 dias ✓
│  └─ Point-in-time recovery ✓
└─ Nada a fazer! Automático!

Custo: $0 (incluído no FREE)
```

##### 2. AUDIT TRAIL (Banco de dados local)

```
Já está no código (FASE 5.2A)

Apenas verificar que:
├─ Tabela audit_log criada ✓
├─ Logs sendo inseridos ✓
├─ Queries testadas ✓
└─ Funcionando!

Custo: $0 (incluso no projeto)
```

##### 3. DATA RETENTION POLICY (Cron job)

```
ARQUIVO: src/backend/jobs/dataRetention.js

const schedule = require('node-schedule');

// Limpar dados com mais de 180 dias
schedule.scheduleJob('0 2 * * *', async () => {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 180);
  
  await HistoricoTicket.destroy({
    where: {
      criado_em: { [Op.lt]: dataLimite }
    }
  });
  
  console.log('Data retention cleanup executado');
});

Integrar em: src/backend/server.js

require('./jobs/dataRetention');
```

---

## 🎯 SEMANA 6 - DEPLOY + PRODUÇÃO (12-15 horas)

### FASE 6.1: Infraestrutura FREE TIER (5-6 horas)

#### 1. NEO POSTGRESQL (Database)

```
🌐 SITE: https://neon.tech

PASSO A PASSO:

1️⃣ CRIAR CONTA:
   URL: https://console.neon.tech
   
   ├─ Email
   ├─ Senha
   ├─ Verificar email
   └─ Sign up

2️⃣ CRIAR PROJETO:
   
   ├─ "New Project"
   ├─ Name: "whatsapp-saas"
   ├─ Postgres version: "15" (latest)
   ├─ Region: "us-east-1" ou closer
   ├─ Create project
   └─ Aguardar (~2-3 min)

3️⃣ COPIAR CONNECTION STRING:
   
   ├─ Depois que criar:
   ├─ Dashboard → "Connection strings"
   ├─ Copiar a URL "psql" completa
   │  └─ postgresql://user:password@host/dbname?sslmode=require
   └─ Guardar em anotação

4️⃣ TESTAR CONEXÃO LOCAL:
   
   Terminal:
   psql postgresql://user:password@host/dbname?sslmode=require
   
   Debe conectar! ✓

5️⃣ MIGRAR DADOS (primeira vez):
   
   .env.production:
   DATABASE_URL=postgresql://neon-user:password@host/neon-db?sslmode=require
   
   Terminal:
   NODE_ENV=production npm run db:migrate
   NODE_ENV=production npm run db:seed
   
   Deve completar sem erros! ✓

6️⃣ TESTAR:
   
   Terminal:
   psql postgresql://neon-user:password@host/dbname?sslmode=require
   \dt
   
   Deve listar todas as tabelas! ✓

CUSTO: $0 (FREE tier covers 2 clients)
```

#### 2. VERCEL (Frontend)

```
🌐 SITE: https://vercel.com

PASSO A PASSO:

1️⃣ CRIAR CONTA:
   URL: https://vercel.com/signup
   
   ├─ Clique "Sign up with GitHub"
   ├─ Autorizar Vercel
   └─ Done

2️⃣ IMPORTAR PROJETO:
   
   ├─ Dashboard → "Add New"
   ├─ "Project"
   ├─ Selecionar repo: "whatsapp-saas"
   └─ Import

3️⃣ CONFIGURAR BUILD:
   
   Framework: "Vite"
   Build Command: "npm run build --prefix src/frontend"
   Output Directory: "src/frontend/dist"
   Install Command: "pnpm install"

4️⃣ ENVIRONMENT VARIABLES:
   
   ├─ Settings → Environment Variables
   ├─ Adicionar:
   │  ├─ VITE_API_URL=https://api.seu-crm.com (depois)
   │  ├─ VITE_SOCKET_URL=https://api.seu-crm.com (depois)
   │  └─ Salvar
   └─ Deploy

5️⃣ PRIMEIRO DEPLOY:
   
   ├─ Clique "Deploy"
   ├─ Aguardar (~2-3 min)
   ├─ Build deve passar ✓
   └─ URL gerada: seu-projeto.vercel.app

6️⃣ TESTAR:
   
   ├─ Clique URL do projeto
   ├─ Deve abrir seu-projeto.vercel.app
   ├─ Deve ser seu CRM!
   └─ ✓ Funcionando

7️⃣ AUTO-DEPLOY:
   
   ├─ A partir de agora:
   ├─ Toda vez que fizer push em main
   ├─ Vercel faz deploy automático
   ├─ Sem fazer mais nada!
   └─ ✓ Automático!

CUSTO: $0 (FREE tier)
```

#### 3. RAILWAY (Backend)

```
🌐 SITE: https://railway.app

PASSO A PASSO:

1️⃣ CRIAR CONTA:
   URL: https://railway.app
   
   ├─ Clique "Sign up"
   ├─ GitHub → Autorizar
   └─ Done

2️⃣ CRIAR PROJETO:
   
   ├─ Dashboard → "New Project"
   ├─ "Deploy from GitHub repo"
   ├─ Selecionar: "whatsapp-saas"
   └─ Deploy

3️⃣ CONFIGURAR BANCO:
   
   ├─ No projeto Railway:
   ├─ "Add" → "Database" → "PostgreSQL"
   ├─ MAS não usar esse!
   ├─ Ao invés, usar Neon externo
   └─ Delete esse PostgreSQL

4️⃣ CONFIGURAR VARIÁVEIS:
   
   ├─ Project → "Variables"
   ├─ Adicionar:
   │  ├─ DATABASE_URL=postgresql://neon-user:pass@host/db?ssl=require
   │  ├─ NODE_ENV=production
   │  ├─ JWT_SECRET=[gerar valor aleatório de 32 chars]
   │  ├─ PORT=3000
   │  ├─ GOOGLE_CLIENT_ID=xxx
   │  ├─ GOOGLE_CLIENT_SECRET=xxx
   │  ├─ MICROSOFT_CLIENT_ID=xxx
   │  ├─ MICROSOFT_CLIENT_SECRET=xxx
   │  ├─ TWILIO_ACCOUNT_SID=xxx
   │  ├─ TWILIO_AUTH_TOKEN=xxx
   │  ├─ SENDGRID_API_KEY=xxx
   │  ├─ SENTRY_DSN=xxx (depois)
   │  └─ Salvar

5️⃣ CONFIGURAR BUILD:
   
   ├─ "Deployments" → "Settings"
   ├─ Build Command: "npm install && npm run db:migrate"
   ├─ Start Command: "npm start"
   ├─ Root Directory: "./"
   └─ Salvar

6️⃣ PRIMEIRO DEPLOY:
   
   ├─ Clique "Redeploy"
   ├─ Aguardar build (~5 min)
   ├─ Build deve passar ✓
   ├─ Migração deve completar ✓
   └─ URL gerada: seu-projeto.up.railway.app

7️⃣ TESTAR:
   
   ├─ Terminal:
   curl https://seu-projeto.up.railway.app/api/planos/disponibles
   
   ├─ Deve retornar JSON com planos ✓
   └─ Backend funcionando!

8️⃣ AUTO-DEPLOY:
   
   ├─ A partir de agora:
   ├─ Toda vez que fizer push em main
   ├─ Railway faz deploy automático
   ├─ Tudo acontece sozinho!
   └─ ✓ Automático!

CUSTO: $0 (crédito $5/mês = suficiente para 2 clientes)
```

#### 4. DOMAIN + DNS (seu-crm.com)

```
Se já tiver domínio:

🌐 SITE: https://www.nomeservidordominio.com (seu registrar)

PASSO A PASSO:

1️⃣ NO REGISTRADOR (ex: GoDaddy, NameCheap):
   
   ├─ Login
   ├─ Domínio: seu-crm.com
   ├─ DNS Settings
   └─ Editar records

2️⃣ ADICIONAR RECORDS:

   A. Para Frontend (Vercel):
      ├─ CNAME seu-crm.com → seu-projeto.vercel.app
   
   B. Para API (Railway):
      ├─ CNAME api.seu-crm.com → seu-projeto.up.railway.app

3️⃣ ESPERAR:
   
   ├─ DNS propaga em 15 min - 24 horas
   ├─ Testar: ping seu-crm.com
   └─ Quando resolver, domínio funciona!

4️⃣ SSL AUTOMÁTICO:
   
   ├─ Vercel: automático ✓
   ├─ Railway: automático ✓
   └─ Sem fazer mais nada!

CUSTO: Domínio $10-15/ano (se não tiver)
```

---

### FASE 6.2: Serviços Externos (4-5 horas)

#### 1. SENDGRID (Email)

```
🌐 SITE: https://sendgrid.com

PASSO A PASSO:

1️⃣ CRIAR CONTA:
   URL: https://sendgrid.com/free
   
   ├─ Email
   ├─ Senha
   ├─ Nome
   ├─ Verificar email
   └─ Setup completo

2️⃣ CRIAR API KEY:
   
   ├─ Dashboard → "Settings"
   ├─ "API Keys"
   ├─ "Create API Key"
   ├─ Name: "CRM Production"
   ├─ Permissions: "Full Access" (pode restringir depois)
   ├─ Create
   └─ Copiar chave (só aparece uma vez!)

3️⃣ GUARDAR NO .ENV:
   
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

4️⃣ INTEGRAR NO CÓDIGO:

   ARQUIVO: src/backend/services/emailService.js
   
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   
   async function enviarEmail(para, assunto, html) {
     try {
       await sgMail.send({
         to: para,
         from: 'noreply@seu-crm.com',
         subject: assunto,
         html: html
       });
       return true;
     } catch (error) {
       console.error('Erro SendGrid:', error);
       return false;
     }
   }

5️⃣ CONFIGURAR SENDER (importante!):
   
   ├─ Dashboard → "Settings"
   ├─ "Sender Authentication"
   ├─ "Verify a Single Sender"
   ├─ Adicionar: noreply@seu-crm.com
   ├─ Verificar email (clique link)
   └─ Pronto!

6️⃣ TESTAR:
   
   Terminal:
   node -e "
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   sgMail.send({
     to: 'seu@email.com',
     from: 'noreply@seu-crm.com',
     subject: 'Teste',
     html: '<strong>Teste SendGrid</strong>'
   }).then(() => console.log('Email enviado!'));
   "
   
   Deve receber email em segundos! ✓

CUSTO: $0 (FREE = 100 emails/dia = 3k/mês)
```

#### 2. SENTRY (Error Tracking)

```
🌐 SITE: https://sentry.io

PASSO A PASSO:

1️⃣ CRIAR CONTA:
   URL: https://sentry.io/signup
   
   ├─ GitHub → Autorizar
   └─ Done

2️⃣ CRIAR PROJETO:
   
   ├─ Dashboard → "Projects"
   ├─ "Create Project"
   ├─ Platform: "Node.js"
   ├─ Alert me on every new issue ✓
   ├─ Create Project
   └─ Copiar DSN

3️⃣ GUARDAR NO .ENV:
   
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

4️⃣ INTEGRAR BACKEND:

   ARQUIVO: src/backend/server.js (início do arquivo)
   
   const Sentry = require("@sentry/node");
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,
   });

5️⃣ INTEGRAR FRONTEND:

   ARQUIVO: src/frontend/src/main.tsx (início)
   
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "https://xxxxx@xxxxx.ingest.sentry.io/xxxxx",
     environment: import.meta.env.MODE,
     tracesSampleRate: 1.0,
   });

6️⃣ TESTAR:
   
   Backend:
   // Gerar erro intencional
   throw new Error("Teste Sentry");
   
   Deve aparecer em Sentry dashboard em segundos! ✓

CUSTO: $0 (FREE = 5k events/mês)
```

#### 3. GITHUB ACTIONS (CI/CD)

```
🌐 SITE: https://github.com

PASSO A PASSO:

1️⃣ GITHUB JÁ ESTÁ ATIVO:
   
   ├─ Repo já exists: https://github.com/seu-user/whatsapp-saas
   └─ Não precisa criar

2️⃣ CRIAR WORKFLOW:
   
   ARQUIVO: .github/workflows/test-deploy.yml
   
   name: Test and Deploy
   
   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]
   
   jobs:
     test:
       runs-on: ubuntu-latest
       
       services:
         postgres:
           image: postgres:15
           env:
             POSTGRES_PASSWORD: postgres
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
       
       steps:
       - uses: actions/checkout@v3
       
       - name: Use Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '20'
       
       - name: Install dependencies
         run: npm install
       
       - name: Run tests
         run: npm test
       
       - name: Build frontend
         run: npm run build --prefix src/frontend
       
       - name: Deploy to Railway
         if: github.event_name == 'push' && github.ref == 'refs/heads/main'
         env:
           RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
         run: npm install -g @railway/cli && railway up

3️⃣ ADICIONAR SECRET:
   
   ├─ GitHub repo → "Settings"
   ├─ "Secrets and variables"
   ├─ "Actions" → "New repository secret"
   ├─ Name: RAILWAY_TOKEN
   ├─ Value: [obter do Railway]
   │  └─ Railway → Account → "API Tokens"
   │  └─ Create token
   │  └─ Copiar
   └─ Salvar

4️⃣ FUNCIONA AUTOMÁTICO:
   
   ├─ Próximo push:
   ├─ GitHub Actions roda testes
   ├─ Se passar → Deploy automático Railway
   └─ ✓ Zero manual!

CUSTO: $0 (GitHub Actions FREE)
```

---

### FASE 6.3: Documentação Operacional (3-4 horas)

#### Parte A: README PRODUÇÃO

```
ARQUIVO: README-PRODUCAO.md

# 🚀 WHATSAPP SaaS CRM - GUIA DE PRODUÇÃO

## ⚙️ INFRAESTRUTURA

### Database (Neon)
- URL: https://console.neon.tech
- Projeto: whatsapp-saas
- Backups: Automáticos (7 dias)
- Restore: https://neon.tech/docs/manage/backups

### Frontend (Vercel)
- URL: https://vercel.com/seu-user/seu-projeto
- Auto-deploy: Main branch
- DNS: seu-crm.com

### Backend (Railway)
- URL: https://railway.app
- Auto-deploy: Main branch
- DNS: api.seu-crm.com
- Crédito: $5/mês (suficiente)

### Email (SendGrid)
- Account: https://app.sendgrid.com
- API Key: .env SENDGRID_API_KEY
- Sender: noreply@seu-crm.com

### Error Tracking (Sentry)
- Account: https://sentry.io
- DSN: .env SENTRY_DSN
- Issues: https://sentry.io/issues/

## 🔧 VARIÁVEIS DE AMBIENTE

Produção (.env.production):
```
DATABASE_URL=postgresql://...
JWT_SECRET=[64 chars aleatório]
NODE_ENV=production
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
SENDGRID_API_KEY=...
SENTRY_DSN=...
VITE_API_URL=https://api.seu-crm.com
VITE_SOCKET_URL=https://api.seu-crm.com
```

## 🚀 DEPLOY MANUAL

```bash
# Ir para repositório
cd seu-projeto

# Pull latest
git pull origin main

# Deploy Railway (automático normalmente)
railway up

# Deploy Vercel (automático normalmente)
# Apenas confirme no Vercel dashboard
```

## 📊 MONITORAR

### Verificar Status
- Backend: https://api.seu-crm.com/health
- Frontend: https://seu-crm.com
- Database: https://console.neon.tech (status)
- Errors: https://sentry.io/issues/

### Logs
- Railway logs: Railway dashboard
- Frontend errors: Sentry
- Database logs: Neon logs

## 🆘 TROUBLESHOOTING

### Backend não inicia
1. Verificar DATABASE_URL no Railway
2. Verificar migrations rodaram
3. Ver Railway logs

### Emails não enviando
1. Verificar SENDGRID_API_KEY
2. Verificar sender verificado
3. Ver SendGrid Activity

### Social login não funciona
1. Verificar GOOGLE_CLIENT_ID
2. Verificar MICROSOFT_CLIENT_ID
3. Verificar callback URLs corretos

## 💰 CUSTOS MENSAIS

- Neon: $0 (FREE)
- Vercel: $0 (FREE)
- Railway: $0 (crédito $5)
- SendGrid: $0 (100/dia)
- Sentry: $0 (5k events)
- **TOTAL: $0** 🎉
```

#### Parte B: GUIA DE ONBOARDING (Cliente)

```
ARQUIVO: docs/ONBOARDING-CLIENTE.md

# 📖 GUIA ONBOARDING - CLIENTE NOVO

## 1️⃣ LOGIN INICIAL

Você vai receber:
- URL: https://seu-crm.com
- Email: seu@empresa.com
- Senha: [temporária - mude na primeira vez]

Clique no link e faça login.

## 2️⃣ CONFIRMAR PLANO

Após login:
1. Vá em "Planos" no menu
2. Veja seu plano (ex: Profissional)
3. Veja limite de mensagens/usuários

## 3️⃣ CONECTAR WHATSAPP

1. Vá em "Cliente" no menu
2. Clique "Conectar WhatsApp"
3. Escaneie QR code com seu telefone
4. Autorize no WhatsApp

Pronto! Agora pode receber mensagens!

## 4️⃣ ADICIONAR USUÁRIOS

Admin:
1. Vá em "Configurações"
2. "Usuários" → "Novo"
3. Email + Papel (Atendente/Supervisor)
4. Convidar

Usuário recebe email com link de ativar.

## 5️⃣ GERENCIAR PERMISSÕES

Admin:
1. Vá em "Permissões"
2. Selecione role (ex: Atendente)
3. Check/uncheck permissões
4. Salvar

## 6️⃣ USAR FILA

1. Vá em "Dashboard"
2. Veja tickets novos
3. Clique ticket para responder
4. Escreva resposta
5. Enviar

Pronto!

## 🆘 SUPORTE

Dúvidas? Email: suporte@seu-crm.com

## 📱 2FA (Autenticação de 2 Fatores)

Para mais segurança:
1. Settings → Segurança
2. Habilitar 2FA
3. Escolha: SMS ou Authenticator
4. Confirmar

Próximas vezes que logar, pede código!
```

---

### FASE 6.4: Testes em Produção (2-3 horas)

```
CHECKLIST FINAL - TUDO FUNCIONANDO?

□ Database conecta (Neon)
□ Migrations rodaram
□ Frontend está online (Vercel)
□ Backend está online (Railway)
□ Domínio está apontando
□ SSL funciona (HTTPS)
□ Login normal funciona
□ 2FA SMS mock funciona
□ Google OAuth funciona
□ Microsoft OAuth funciona
□ Email enviando (SendGrid)
□ Erros vão para Sentry
□ Socket.io real-time funciona
□ Admin pode criar cliente
□ Admin pode criar usuário
□ Admin pode ver fila
□ Cliente pode ver seu plano
□ Cliente pode ver uso
□ Planos estão corretos
□ Permissões respeitadas
□ RBAC bloqueando corretamente
□ Backup neon funcionando
□ Performance OK (< 1s)

Tudo ✓? 
→ PRONTO PARA CLIENTE! 🎉
```

---

## 📊 RESUMO FINAL SEMANA 5-6

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  SEMANA 5: Segurança + LGPD (10-12h)                     ║
║  ├─ FASE 5.1A: Código 2FA (2-3h)                         ║
║  ├─ FASE 5.1B: Twilio + Google + Microsoft (1-2h)        ║
║  ├─ FASE 5.2A: Código LGPD (3-4h)                        ║
║  └─ FASE 5.2B: Backup + Audit (2-3h)                     ║
║                                                            ║
║  SEMANA 6: Deploy + Produção (12-15h)                    ║
║  ├─ FASE 6.1: Infra (5-6h)                               ║
║  │  ├─ Neon PostgreSQL                                   ║
║  │  ├─ Vercel Frontend                                   ║
║  │  ├─ Railway Backend                                   ║
║  │  └─ Domain + DNS                                      ║
║  ├─ FASE 6.2: Serviços (4-5h)                            ║
║  │  ├─ SendGrid                                          ║
║  │  ├─ Sentry                                            ║
║  │  └─ GitHub Actions                                    ║
║  ├─ FASE 6.3: Docs (3-4h)                                ║
║  │  ├─ README Produção                                   ║
║  │  └─ Onboarding Cliente                                ║
║  └─ FASE 6.4: Testes (2-3h)                              ║
║                                                            ║
║  ═════════════════════════════════════════════════════   ║
║  TOTAL: 22-27 horas (código + operacional)              ║
║  RESULTADO: Sistema 100% pronto + grátis! ✅             ║
║  ═════════════════════════════════════════════════════   ║
║                                                            ║
║  CUSTO MENSAL: $0 🎉                                      ║
║  12 FASES COMPLETAS: 100% ✅                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🎯 CRONOGRAMA FINAL PROJETO

```
Dia 14/Julho (Segunda):
├─ SEMANA 3: MVP Core (6 fases) - 4h35min ✅
└─ FASE 4.1: RBAC (1 fase) - 1h10min ✅

Dia 15/Julho (Terça):
├─ Manhã: Descanso 14-15h
└─ Tarde: FASE 4.2: Planos (1 fase) - 3-4h ✅

Dia 16/Julho (Quarta):
├─ SEMANA 5: Segurança (2 fases)
│  ├─ FASE 5.1: 2FA + Social (4-5h)
│  └─ FASE 5.2: LGPD (5-6h)
└─ Total: 10-12h

Dia 17/Julho (Quinta):
├─ SEMANA 6: Deploy (4 fases)
│  ├─ FASE 6.1: Infraestrutura (5-6h)
│  ├─ FASE 6.2: Serviços (4-5h)
│  ├─ FASE 6.3: Documentação (3-4h)
│  └─ FASE 6.4: Testes (2-3h)
└─ Total: 12-15h

═════════════════════════════════════════
TOTAL PROJETO: ~40-50 horas
CONCLUSÃO: 17/Julho/2026 (Quinta à noite)
RESULTADO: CRM PRONTO PARA CLIENTE ✅
═════════════════════════════════════════
```
