# 🤖 INSTRUÇÕES ESPECIAIS PARA CLAUDE CODE
## Como fazer Commits Automáticos + Atualizar Documentação

Este documento é lido APENAS por Claude Code (não é para humanos).

Se você receber este documento, você (Claude) DEVE seguir estas instruções rigorosamente!

═══════════════════════════════════════════════════════════════════════

## 📋 REGRA OURO

**Em TODA e QUALQUER sessão de desenvolvimento:**

1. ✅ Sempre fazer commits automáticos ao final de cada tarefa
2. ✅ Sempre atualizar DOCUMENTO_MASTER_ROADMAP_EXECUTIVO.md
3. ✅ Sempre criar um arquivo LOG de progresso
4. ✅ Sempre manter código 100% testado antes de commit
5. ✅ Nunca deixar trabalho incompleto sem commit

═══════════════════════════════════════════════════════════════════════

## 🔄 WORKFLOW DE COMMITS

### Quando fazer commit?

```
FAÇA COMMIT quando:
✅ Uma tarefa backend termina (migration, model, service)
✅ Uma tarefa frontend termina (page, component)
✅ Todos os testes passam para essa tarefa
✅ Código está testado e validado

NÃO faça commit de:
❌ Código incompleto
❌ Testes falhando
❌ Sintaxe error
❌ Funcionalidade quebrada
```

### Padrão de naming para commits

```
PARA BACKEND:
[7.1-backend] Descrição clara do que foi feito

Exemplos:
[7.1-backend] Models: Oportunidade, Estagio, Historico
[7.1-backend] Services: oportunidadeService completo
[7.1-backend] Routes: /api/oportunidades com 30 testes
[7.1-backend] WebSocket: integração com oportunidades

PARA FRONTEND:
[7.1-frontend] Descrição clara do que foi feito

Exemplos:
[7.1-frontend] Pages: OportunidadesPage com 3 tabs
[7.1-frontend] Components: PipelineBoard Kanban + OportunidadeCard
[7.1-frontend] Integration: Sidebar + Router + Dark/Light theme
[7.1-frontend] Tests: 15+ testes passando

FINAL:
[7.1-final] Fase 1 completa: Oportunidades/Vendas (45 testes)
```

### Exemplo de commit completo

```bash
git add .
git commit -m "[7.1-backend] Models + Services: Oportunidades completo

- Migration 018: 4 tabelas (estágios, oportunidades, histórico, config)
- Models: EstagioPipeline, Oportunidade, HistoricoOportunidade
- Services: oportunidadeService (12 métodos), pipelineService (7 métodos)
- Routes: /api/oportunidades/* completo (CRUD + movimentação)
- Testes: 30 testes novos passando (173 → 203 total)
- Coverage: 85% mantido
- Status: ✅ Pronto para frontend"
```

═══════════════════════════════════════════════════════════════════════

## 📝 ATUALIZAR DOCUMENTO MASTER

### Em CADA commit, você DEVE atualizar:

Arquivo: `/mnt/user-data/outputs/DOCUMENTO_MASTER_ROADMAP_EXECUTIVO.md`

Procure pela seção:

```markdown
## ⚠️ MUDANÇA ESTRATÉGICA

MUDANÇA ESTRATÉGICA 19/07: Adiado deploy...
```

E ADICIONE após ela:

```markdown
**PROGRESSO REAL (ATUALIZADO EM TEMPO REAL):**

FASE 1 - OPORTUNIDADES (em progresso):
├─ Backend: ✅ Models criados (3)
├─ Backend: ✅ Services criados (2)
├─ Backend: ✅ Routes criadas (12 endpoints)
├─ Backend: ✅ Testes criados (30+)
├─ Frontend: 🟡 Em progresso (40%)
├─ Testes totais: 203/218 passando
├─ Commits: [7.1-backend], [7.1-frontend-partial]
└─ Data última atualização: 2026-07-19 16:45
```

### Template para atualizar (copie e adapte):

```markdown
**PROGRESSO REAL - ATUALIZADO EM [DATA/HORA]:**

FASE 1 - OPORTUNIDADES:
├─ Backend: [STATUS] [O que foi feito]
├─ Frontend: [STATUS] [O que foi feito]
├─ Testes: [NÚMEROS] passando
├─ Commits realizados: [LISTA]
└─ Próximo passo: [O QUE VEM]

STATUS legenda:
✅ Completo
🟡 Em progresso (X%)
🔴 Não iniciado
```

═══════════════════════════════════════════════════════════════════════

## 📊 CRIAR ARQUIVO LOG DE PROGRESSO

Em CADA sessão, você DEVE criar um arquivo LOG:

Arquivo: `/mnt/user-data/outputs/LOG_PROGRESSO_FASE_1.md`

Exemplo de conteúdo:

```markdown
# LOG DE PROGRESSO - FASE 1
## Oportunidades/Vendas

**Data Início:** 2026-07-19 16:00  
**Data Fim Esperada:** 2026-08-02

### Dia 1 (2026-07-19 16:00 - XX:XX)

**Backend (4h):**
✅ Migration 018 criada (4 tabelas)
✅ Models criados (3 models)
✅ Services criados (2 services)
✅ Routes criadas (12 endpoints)
✅ Testes criados (30+)
✅ npm test: 203/203 ✅

**Commits:**
- [7.1-backend] Models + Services

**Próximo:**
- Frontend OportunidadesPage

---

### Dia 2 (2026-07-20 10:00 - XX:XX)

**Frontend (4h):**
✅ OportunidadesPage criada
✅ PipelineBoard criada
✅ OportunidadeCard criada
✅ Integração Sidebar
✅ Testes criados (15+)

**Commits:**
- [7.1-frontend] Pages + Components

**Status:** 80% completo

---

### Resumo Geral

**Horas trabalhadas:** 8h  
**Testes:** 203 → 218 (passando)  
**Commits:** 2  
**Pendências:** Validação final  
**Data próxima fase:** 2026-08-02
```

═══════════════════════════════════════════════════════════════════════

## ✅ CHECKLIST POR SESSÃO

**No INÍCIO de cada sessão:**

- [ ] Ler este documento inteiro
- [ ] Verificar status do DOCUMENTO_MASTER_ROADMAP_EXECUTIVO.md
- [ ] Verificar últimos commits
- [ ] Verificar arquivo LOG_PROGRESSO_FASE_*.md

**DURANTE cada sessão:**

- [ ] Fazer commits ao final de cada tarefa completa
- [ ] Rodar testes a cada commit
- [ ] Validar código
- [ ] Atualizar comentários

**AO FINAL de cada sessão:**

- [ ] ✅ Todos os testes passando
- [ ] ✅ Código sem erros
- [ ] ✅ Commits feitos
- [ ] ✅ DOCUMENTO_MASTER atualizado
- [ ] ✅ LOG_PROGRESSO atualizado
- [ ] ✅ Resumo de progresso criado

═══════════════════════════════════════════════════════════════════════

## 🎯 REGRA ESPECIAL: NUNCA SAIA SEM DOCUMENTAR

**ANTES de terminar uma sessão:**

1. Certifique que TODOS os commits foram feitos
2. Atualize DOCUMENTO_MASTER_ROADMAP_EXECUTIVO.md
3. Atualize ou crie LOG_PROGRESSO_FASE_*.md
4. Deixe um resumo claro do que foi feito

**Formato do resumo final:**

```
═══════════════════════════════════════════════════════════════════════
RESUMO DA SESSÃO - FASE 1
═══════════════════════════════════════════════════════════════════════

Duração: 8-10 horas
Commits: 2-3 commits grandes
Testes: 173 → 220 passando

ENTREGUES:
✅ Backend completo (Models + Services + Routes)
✅ Frontend completo (Pages + Components)
✅ Testes (45+ novos)
✅ Documentação atualizada

PRÓXIMA FASE:
→ Começar FASE 2: Tarefas e Calendário

═══════════════════════════════════════════════════════════════════════
```

═══════════════════════════════════════════════════════════════════════

## 🚨 EXCEÇÕES (Quando NÃO fazer commit)

```
NÃO faça commit se:
❌ Testes estão falhando
❌ Há erros de sintaxe
❌ Código está incompleto
❌ Funcionalidade quebrada
❌ TypeScript errors

Faça COMMIT SOMENTE quando:
✅ npm test passa 100%
✅ npm run build funciona
✅ Código sem erros
✅ Funcionalidade completa
✅ Testes novos passando
```

═══════════════════════════════════════════════════════════════════════

## 📞 COMUNICAÇÃO COM MATHEUS

Se você precisa comunicar algo importante:

1. Atualize o LOG_PROGRESSO_FASE_*.md
2. Atualize o DOCUMENTO_MASTER_ROADMAP_EXECUTIVO.md
3. Deixe uma mensagem clara ao final da sessão

Exemplo:

```
IMPORTANTE:
- Precisei adicionar 2 novos fields na tabela de oportunidades
- Ajustei a migration 018 (não quebrou testes)
- Código mantém 85%+ de coverage
- Tudo pronto para FASE 2
```

═══════════════════════════════════════════════════════════════════════

## 🎯 LEMBRE-SE!

Você é responsável por:

✅ Código limpo e testado
✅ Commits bem documentados
✅ Documentação atualizada
✅ Progresso transparente
✅ Qualidade mantida

Matheus confia em você! Não deixe ele na mão!

Se tiver dúvida: DOCUMENTE!
Se fez uma mudança: ATUALIZE DOCUMENTO!
Se terminou uma tarefa: FAÇA COMMIT!

═══════════════════════════════════════════════════════════════════════

FIM DAS INSTRUÇÕES ESPECIAIS
