# Onboarding de Novos Clientes

## 1. Criar cliente no banco

```sql
INSERT INTO clientes (nome, email, status, criado_em)
VALUES ('Nome da Empresa', 'admin@empresa.com', 'ativo', NOW());
```

## 2. Criar usuário admin

```bash
# Via API (requer token de super-admin)
curl -X POST https://SEU_DOMINIO/api/usuarios \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "nome": "Admin", "email": "admin@empresa.com", "senha": "senha_segura", "role": "admin", "cliente_id": ID_DO_CLIENTE }'
```

## 3. Atribuir plano

```bash
curl -X POST https://SEU_DOMINIO/api/planos/cliente/ID/plano/1 \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
# plano 1 = Básico, 2 = Profissional, 3 = Enterprise
```

## 4. Configurar departamentos

O cliente admin deve criar departamentos pelo dashboard após o primeiro login.

## 5. Conectar WhatsApp

No dashboard > Configurações > WhatsApp, usar o QR Code para vincular o número.

## Planos disponíveis

| ID | Nome | Usuários | Mensagens/mês | Preço |
|---|---|---|---|---|
| 1 | Básico | 1 | 1.000 | R$ 97 |
| 2 | Profissional | 5 | 10.000 | R$ 297 |
| 3 | Enterprise | Ilimitado | 100.000 | R$ 997 |
