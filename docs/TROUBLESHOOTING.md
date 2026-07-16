# Troubleshooting

## Banco de dados

### `getaddrinfo ENOTFOUND postgres`
- **Causa:** DATABASE_URL aponta para hostname Docker (`postgres`) fora do container
- **Fix:** Mudar para `localhost:5432` no `.env`

### `operator does not exist: character varying = enum_usuarios_role`
- **Causa:** Comparação de tipo sem cast no seeder 011
- **Fix:** Rodar `npm run db:migrate` — migration 014 corrige automaticamente

### Migração trava
```bash
# Ver conexões ativas
SELECT pid, query FROM pg_stat_activity WHERE state = 'active';
# Cancelar conexão travada
SELECT pg_terminate_backend(PID);
```

## Testes

### Tests falhando com `Bearer undefined`
- **Causa:** Usuário com 2FA ativo não limpo entre runs — `loginUser` retorna `{ tempToken }` em vez de `{ token }`
- **Fix:** `DELETE FROM usuario_2fa WHERE usuario_id IN (1, 4)` e reiniciar testes

### `column role_permissoes.createdAt does not exist`
- **Causa:** Associação M2M usando string em vez de modelo explícito
- **Fix:** Já corrigido em `RolePermissao.js` com `timestamps: false`

## Produção

### 503 em `/health/ready`
- Banco de dados offline ou DATABASE_URL incorreta
- Verificar variáveis de ambiente no painel do Railway

### Token JWT "inválido" após redeploy
- Se `JWT_SECRET` foi alterado, todos os tokens anteriores são invalidados
- Usuários precisam fazer login novamente (comportamento esperado)

### 2FA não funcionando
- Verificar `ENCRYPTION_KEY` — deve ter exatamente 32 caracteres
- TOTP depende do horário correto do servidor (NTP)

### Sessão OAuth perdida
- Verificar `JWT_SECRET` — usado como secret da sessão Express
- Em produção, configurar Redis para sessões persistentes (opcional)
