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
# Edite o .env com suas credenciais

# 3. Rodar em desenvolvimento
npm run dev

# 4. Testar
curl http://localhost:3000/health
```

## Estrutura

```
src/
├── backend/
│   ├── config/        # database.js, environment.js
│   ├── controllers/   # Lógica de negócio
│   ├── middleware/    # auth.js, errorHandler.js
│   ├── models/        # Sequelize models
│   ├── routes/        # Endpoints da API
│   ├── services/      # WhatsApp, fila, email
│   └── server.js      # Entry point
└── frontend/
    ├── admin/         # Painel do administrador (Fase 3)
    └── cliente/       # Painel do cliente (Fase 3)
database/
├── migrations/        # Criação de tabelas
└── seeds/             # Dados iniciais
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| GET | `/api/status` | Status da API |
| POST | `/api/auth/register` | Registrar usuário (Fase 1.3) |
| POST | `/api/auth/login` | Login (Fase 1.3) |

## Progresso

- [x] Fase 1.1 - Setup inicial
- [ ] Fase 1.2 - Servidor Express completo
- [ ] Fase 1.3 - Autenticação JWT Multi-Tenant
- [ ] Fase 2 - WhatsApp + Fila
- [ ] Fase 3 - Painéis React
- [ ] Fase 4 - Deploy + Produção
