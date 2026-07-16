# Runbook Operacional

## Health Checks

```bash
# Status geral
curl https://SEU_DOMINIO/health

# Prontidão (verifica banco)
curl https://SEU_DOMINIO/health/ready
```

## Migrações

```bash
# Rodar migrações pendentes
npm run db:migrate

# Desfazer última migração
npm run db:migrate:undo

# Ver estado das migrações
npx sequelize-cli db:migrate:status
```

## Logs

No Railway: Dashboard > Logs

Filtros úteis:
- `[CRON]` — jobs de limpeza automática (2 AM)
- `Banco de dados conectado` — startup ok
- `Erro` — qualquer falha

## Reiniciar serviço

No Railway: Dashboard > Deployments > Redeploy

## Backup do banco

No Neon/Supabase: Dashboard > Backups > Download

## Rollback de deploy

```bash
# No GitHub Actions, re-run do job de um commit anterior
# Ou via Railway: Deployments > selecionar versão anterior > Rollback
```

## Escalar

No Railway: Dashboard > Settings > Resources > aumentar RAM/CPU

## Data Cleanup Manual

```bash
# Forçar cleanup para um cliente
node -e "
  require('dotenv').config();
  const { DataRetentionService } = require('./src/backend/services/dataRetentionService');
  DataRetentionService.executarCleanup(ID_DO_CLIENTE).then(console.log);
"
```
