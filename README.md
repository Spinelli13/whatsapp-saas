# SI-CRM

Plataforma profissional de CRM para WhatsApp, desenvolvida pela **Soluções Imediatas Tecnologia**.

**Desenvolvido por:** Soluções Imediatas Tecnologia

## Features

- Gerenciamento de conversas WhatsApp em tempo real
- Relatórios e analytics avançados
- Chatbot inteligente com fluxos configuráveis
- Roteamento automático de atendimentos por departamento
- Notas internas e comunicação entre atendentes
- Transferências inteligentes entre agentes
- 566+ testes de cobertura
- Segurança multi-tenant com isolação completa por cliente
- Interface responsiva com suporte a tema claro/escuro

## Stack Tecnológico

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, Sequelize ORM
- **Database:** PostgreSQL
- **Deploy:** Vercel (Frontend), Render (Backend), Supabase (Database)
- **Real-time:** Socket.io
- **Testes:** Jest (566+ testes)

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
```

## Credenciais de Teste

- `admin@cliente1.com` / `password123` — Admin cliente 1
- `ana@cliente1.com` / `password123` — Atendente cliente 1
- `admin@barcos.com` / `password123` — Admin cliente 2

Ver [docs/TESTES.md](docs/TESTES.md) para guia completo de testes.

## Estrutura

```
si-crm/
├── src/
│   ├── backend/       # Node.js/Express API
│   └── frontend/      # React/Vite SPA
├── database/
│   └── migrations/    # Sequelize migrations
├── tests/             # Jest test suites
├── docs/              # Documentação
└── docker-compose.yml
```

## Scripts

```bash
npm test                 # Rodar testes (566+)
npm run frontend:build   # Build do frontend
npm run db:migrate       # Rodar migrations
npm run db:seed          # Popular banco com seed data
```
