# 🚀 INSTRUÇÕES: RODAR MIGRATIONS E SEEDS MANUALMENTE

## 📍 AMBIENTE

**Local:** C:\Users\mathe\Desktop\whatsapp-saas
**Database:** Supabase
**Banco:** PostgreSQL

---

## 🔐 DATABASE_URL

Não hardcode a `DATABASE_URL` em nenhum arquivo versionado — ela contém a
senha do banco Supabase. O projeto já tem `DATABASE_URL` configurada no
`.env` (gitignored). O Sequelize (`src/backend/config/database.js`) lê essa
variável automaticamente via `dotenv`, então normalmente não é preciso
exportá-la manualmente no terminal — basta ter o `.env` na raiz do projeto.

Se precisar rodar fora do fluxo normal (ex: `DATABASE_URL` de outro ambiente),
exporte-a só na sessão do terminal, sem salvar em arquivo:

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL = Read-Host "Cole a DATABASE_URL"
```

**Mac/Linux:**
```bash
read -s DATABASE_URL && export DATABASE_URL
```

---

## 📋 PASSO-A-PASSO

### 1️⃣ Abra Terminal/PowerShell

Windows: `Win + R` → `powershell`
Mac/Linux: `terminal`

### 2️⃣ Navegue até o projeto

```bash
cd C:\Users\mathe\Desktop\whatsapp-saas
```

### 3️⃣ Confirme que o `.env` existe e tem DATABASE_URL

```bash
Select-String -Path .env -Pattern "DATABASE_URL"
```

Esperado: mostra a linha `DATABASE_URL=...` (sem exibir o conteúdo aqui).

### 4️⃣ Rodar migrations (criar tabelas)

```bash
npm run db:migrate
```

Esperado no output, em ordem:
```
✅ 034_add_master_role_to_usuarios.js
✅ 035_create_cliente_modulos.js
✅ 036_create_planos_modulos.js
✅ 037_create_solicitacoes_upgrade.js
✅ 038_allow_null_cliente_id_usuarios.js
✅ 039_create_modulos_table.js
```

### 5️⃣ Rodar seeds (inserir dados)

```bash
npm run db:seed
```

Esperado no output, em ordem:
```
🌱 Starting seed: 000_populate_modulos.js
  📝 Inserting 7 modules...
  ✅ All 7 modules present
✅ Seed 000_populate_modulos.js completed successfully!

🌱 Starting seed: 001_master_user.js
  📝 Creating master user...
  ✅ Master user created
  📝 Creating default plans...
  ✅ Plans created
  📝 Associating modules to plans...
  ✅ Plano Básico modules: whatsapp
  ✅ Plano Pro modules: whatsapp, analytics, ia, ...
✅ Seed 001_master_user.js completed successfully!
```

---

## ✅ RESULTADO

Depois de rodar ambos os comandos, o banco terá:

### Tabelas criadas
- cliente_modulos (M2M: clientes ↔️ módulos)
- planos_modulos (M2M: planos ↔️ módulos)
- solicitacoes_upgrade (rastrear pedidos de upgrade)
- modulos (7 módulos do sistema)

### Enum alterado
- usuarios.role: adicionado valor 'master'
- usuarios.cliente_id: agora aceita NULL

### Dados inseridos
- Master user: `sistemasimediatos` (senha: `simaster13` — troque após o primeiro login)
- Plano Básico: R$ 299/mês (WhatsApp)
- Plano Pro: R$ 799/mês (7 módulos)
- 7 módulos: whatsapp, analytics, ia, roteamento, transferencias, respostas_rapidas, notas_internas

---

## 🚨 ERROS POSSÍVEIS

| Erro | Causa | Solução |
|------|-------|---------|
| `Database connect ECONNREFUSED` | DATABASE_URL incorreta/faltando | Verificar `.env`, checar se o host Supabase está acessível |
| `relation 'modulos' does not exist` | Migration 039 não rodou | Rodar `npm run db:migrate` novamente |
| `No modules found` | Seed 000 não rodou antes do 001 | Confirmar ordem: `000_populate_modulos.js` antes de `001_master_user.js` |
| `Unique constraint violation on email` | Seed já rodou antes | `npm run db:seed:undo` depois `npm run db:seed` |
| `Unexpected token` | Syntax error em migration | Rodar `node -c <arquivo>` para localizar |

---

## 📞 SE ALGO DER ERRADO

1. Verifique o erro exato no terminal
2. Procure na tabela acima
3. Se não encontrar, me avise com a mensagem de erro
4. Rollback individual:
   - `npm run db:migrate:undo` (desfaz última migration)
   - `npm run db:seed:undo` (desfaz último seed)

---

## 🎉 PRÓXIMO PASSO

Depois que tudo rodar sem erros:

1. Validar no Supabase SQL Editor (se desejar)
2. Trocar a senha do master user (`sistemasimediatos`) após o primeiro login
3. Começar ETAPA 7 (Backend Controllers)
