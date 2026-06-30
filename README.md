# WhatsApp SaaS Multi-Tenant

SaaS de roteamento inteligente para WhatsApp com filas por departamento, multi-tenant e painel em tempo real.

## Stack

- **Backend:** Node.js + Express + Socket.io
- **Banco:** PostgreSQL + Sequelize ORM
- **Auth:** JWT + bcrypt
- **WhatsApp:** Baileys (Fase 2)
- **Frontend:** React + Tailwind (Fase 3)
- **Deploy:** Render

## Início Rápido

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais de banco

# 3. Rodar em desenvolvimento
npm run dev

# 4. Testar health check
curl http://localhost:3000/health
# {"status":"ok","timestamp":"..."}
```

## Testar Autenticação (sem banco)

```bash
# Login com usuário mock (dev only)
curl -s -X POST http://localhost:3000/api/auth/login-mock \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cliente1.com","senha":"password"}'

# Validar token retornado
TOKEN=<cole o token aqui>
curl -s http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

Usuários mock: `admin@cliente1.com`, `atendente@cliente1.com`, `admin@barcos.com` — senha: `password`

Ver [docs/TESTES.md](docs/TESTES.md) para guia completo de testes.

## Estrutura

```
src/
├── backend/
│   ├── config/        # database.js, environment.js
│   ├── middleware/    # auth.js, errorHandler.js
│   ├── models/        # Cliente.js, Usuario.js
│   ├── routes/        # auth.js, index.js
│   ├── services/      # authService.js
│   └── server.js
└── frontend/
    ├── admin/         # Painel admin (Fase 3)
    └── cliente/       # Painel cliente (Fase 3)
database/
├── migrations/        # 001_create_clientes, 002_create_usuarios
└── seeds/
```

## Endpoints

| Método | Rota | Auth? | Descrição |
|--------|------|-------|-----------|
| GET | `/health` | Não | Health check |
| GET | `/api/status` | Não | Status da API |
| POST | `/api/auth/register` | Não | Criar usuário (requer banco) |
| POST | `/api/auth/login` | Não | Login real (requer banco) |
| POST | `/api/auth/login-mock` | Não | Login dev (sem banco) |
| GET | `/api/auth/verify` | Sim | Validar JWT |

## Com banco (Semana 2)

```bash
# Rodar migrations
npm run db:migrate

# Rodar seeds
npm run db:seed
```

## Progresso

- [x] Fase 1.1 - Setup inicial e estrutura
- [x] Fase 1.2 - Servidor Express com middleware
- [x] Fase 1.3 - Autenticação JWT multi-tenant
- [ ] Fase 2 - PostgreSQL + WhatsApp Baileys + Fila
- [ ] Fase 3 - Painéis React (admin + cliente)
- [ ] Fase 4 - Deploy Render + testes com clientes reais
