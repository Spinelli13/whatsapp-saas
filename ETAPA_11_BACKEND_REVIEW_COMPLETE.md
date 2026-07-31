# ETAPA 11: Backend Review — Master/Admin Feature

Revisão do trabalho das ETAPAs 5.5–10 (schema → models → controllers →
middlewares → routes → testes). Todos os números abaixo foram conferidos
rodando os comandos reais, não copiados de um template.

## Commits (mais recente → mais antigo)

```
d48d388 test: add real integration/unit tests for master+admin (54 tests)
72ce591 feat: add master.js and admin.js routes (25 endpoints)
d20b38e feat: add 4 middlewares for master/admin auth and plan limits
770e97a feat: add MasterController and AdminController (25 business methods)
b91447e feat: add schema + models required by Master/AdminController
f37e2fc fix: use raw SQL for cliente_id NOT NULL toggle in migration 038
e847063 fix: move modulos table migration before its dependents (039 -> 033)
fdcc94f docs: add manual instructions for running migrations and seeds
09772f4 chore: remove old demo seeders
8035e03 seed: populate modulos table with 7 system modules
b59389b migration: create modulos table (dependency for seeds)
747176a seed: create master user and default plans with modules
26a6d75 migration: allow usuarios.cliente_id to be nullable
5e77ecb migration: create solicitacoes_upgrade table
d12f874 migration: create planos_modulos table (M2M relationship)
12ffa36 migration: create cliente_modulos table (M2M relationship)
5fe184b migration: add master role to usuarios.role enum
```

## Deliverables

**Schema (10 migrations, 033–042)**: `modulos`, `cliente_modulos`,
`planos_modulos`, `solicitacoes_upgrade`, `permissoes_modulo` tables;
`usuarios.role` gained `master`; `usuarios.cliente_id`,
`solicitacoes_upgrade.admin_id` made nullable; `clientes` gained
`email`/`cnpj`/`telefone`; `planos` gained `status`. All applied and
verified against the live Supabase DB.

**Models**: `Modulo`, `PlanosModulos`, `ClienteModulos`,
`SolicitacaoUpgrade`, `PermissaoModulo` — none existed before this work
despite their tables being created earlier; added with associations in
`src/backend/models/index.js`.

**Controllers** — `grep -c "static async"`:
- `src/backend/controllers/MasterController.js`: 14
- `src/backend/controllers/AdminController.js`: 11

**Middlewares** (4 files in `src/backend/middleware/`):
`verificarMaster.js`, `verificarAdmin.js`, `verificarModuloPermissao.js`,
`verificarLimiteDepartamentos.js`.

**Routes** — `grep -c "router\.(get|post|put|delete)"`:
- `src/backend/routes/master.js`: 14, mounted at `/api/master`
- `src/backend/routes/admin.js`: 11, mounted at `/api/admin`
- Both wired through `routes/index.js` → `server.js` (`app.use('/api', routes)`)

**Tests** (4 files, real DB, no mocks — see `[[test-strategy]]` decision in
ETAPA 10): `tests/master.test.js`, `tests/admin.test.js`,
`tests/verificarMasterAdmin.test.js`, `tests/verificarModuloLimite.test.js`
— 54 `it`/`test` cases, **54/54 passing**, zero residual test data after
each run.

## Verified, not assumed

- `node -c` on all 9 backend files above: all OK.
- `git status`: clean.
- `routes/master.js`/`admin.js` → `verificarJWT` → role middleware →
  controller → `models/index.js` chain confirmed by grep, and previously
  by a live HTTP integration test (ETAPA 9) and by this suite's 54 tests.
- Two real bugs were caught and fixed by actually running this code
  against Supabase (not by reading it): `migration 038`'s
  `changeColumn` silently not applying `NOT NULL` toggle (fixed with raw
  SQL), and `aprovarSolicitacao` throwing on a `ClientePlano` unique
  constraint when re-approving a previously-cancelled plan (fixed with
  `findOrCreate`).

## Known, pre-existing, out of scope

The other 25 files under `tests/` (not touched by this work) reference
seed credentials (`admin@cliente1.com`, etc.) that no longer exist after
the Supabase reset documented in project memory — they were not run as
part of this review since their failures would be unrelated to the
master/admin feature.

## Not done

- `git push origin main` — blocked by the auto-mode classifier in this
  session; **13 commits are local-only**, not yet on the remote.

## Next

ETAPA 12 — push + deploy, once the push is done manually or explicitly
approved.
