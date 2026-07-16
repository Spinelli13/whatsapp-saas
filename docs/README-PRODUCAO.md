# Deploy em Produção

## Pré-requisitos

- Node.js >= 20
- PostgreSQL 15
- Conta no Railway ou Heroku (ou qualquer PaaS com suporte a Procfile)

## Deploy no Railway

1. Conecte o repositório GitHub ao Railway
2. Configure as variáveis de ambiente (veja `.env.production`)
3. O Railway detecta o `Procfile` e executa `npm run db:migrate` antes de subir
4. Acesse `https://SEU_DOMINIO/health` para confirmar que está no ar

## Variáveis obrigatórias

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL completa do PostgreSQL (Neon/Railway/Supabase) |
| `JWT_SECRET` | 64 bytes aleatórios em hex |
| `JWT_REFRESH_SECRET` | 64 bytes aleatórios diferentes |
| `ENCRYPTION_KEY` | Exatamente 32 caracteres (AES-256) |
| `FRONTEND_URL` | URL do frontend em produção |

## Variáveis opcionais

| Variável | Descrição |
|---|---|
| `SENTRY_DSN` | DSN do Sentry para monitoramento de erros |
| `GOOGLE_CLIENT_ID` | Para login social com Google |
| `MICROSOFT_CLIENT_ID` | Para login social com Microsoft |

## Gerar secrets seguros

```bash
# JWT_SECRET e JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# ENCRYPTION_KEY (32 caracteres)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Verificar deploy

```bash
curl https://SEU_DOMINIO/health
# { "status": "ok", "uptime": 12.3, "environment": "production" }

curl https://SEU_DOMINIO/health/ready
# { "status": "ready", "database": "connected" }
```
