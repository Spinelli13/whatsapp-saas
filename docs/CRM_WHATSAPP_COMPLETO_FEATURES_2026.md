# 🚀 CRM WHATSAPP COMPLETO - ANÁLISE DE FEATURES 2026

**Data:** 14/Julho/2026 (Madrugada)  
**Contexto:** Refatorar projeto de MVP para CRM Profissional  
**Base:** Análise de HubSpot, Zendesk, Intercom, Respond.io, Clientify, WATI, Taskip, etc.

---

## 📊 FEATURES COMPLETAS DE CRM WHATSAPP (Profissional)

### **TIER 1: CRÍTICO - Semana 3-4 (20 horas)**

#### **1. GESTÃO DE CONTATOS & CLIENTES**

```
✅ Base de Dados de Contatos
├─ Importar contatos (CSV, Excel, WhatsApp API)
├─ Campos customizáveis (Nome, Email, Telefone, Empresa, Cargo, etc)
├─ Avatar automático (foto do WhatsApp)
├─ Histórico completo de interações
├─ Tags/Categorias por contato
├─ Segmentação automática
├─ Duplicatas: detectar e mesclar
└─ Exportar contatos (CSV, Excel)

✅ Perfil do Contato (360° View)
├─ Dados pessoais + profissionais
├─ Histórico de conversas (todas as mensagens)
├─ Notas e observações privadas
├─ Status último acesso
├─ Fonte de origem (WhatsApp, manual, importado)
├─ Valor do cliente (LTV - Life Time Value)
├─ Propostas/Oportunidades relacionadas
└─ Timeline de eventos
```

#### **2. GESTÃO DE CONVERSAS & TICKETS**

```
✅ Shared Inbox (Inbox Compartilhado)
├─ Inbox unificado de todas as conversas
├─ Notificações em tempo real
├─ Marcar como lido/não lido
├─ Arquivar conversas
├─ Atribuir a agente específico
├─ Prioridades (Baixa, Normal, Alta, Crítica)
├─ Filtros avançados (por status, agente, data, tag)
├─ Busca full-text em conversas
└─ Marcar favoritos/pinned

✅ Ticket System
├─ Ticket ID automático (#TK-001, #TK-002)
├─ Estados: Novo → Aberto → Respondendo → Fechado → Reaberto
├─ Atribuição automática (round-robin, skill-based)
├─ Reatribuição manual
├─ SLA (Service Level Agreement) tracking
├─ Time de resolução automático
├─ Escalação para supervisor
├─ Histórico de quem atendeu
└─ Re-abertura automática se cliente responder

✅ Routing Inteligente
├─ Roteamento por departamento
├─ Roteamento por habilidade (skill-based)
├─ Roteamento por carga do agente
├─ Roteamento por disponibilidade
├─ Regras customizáveis
├─ Fila de espera com estimativa
├─ Bot response antes de humano
└─ Fallback automático se agente indisponível
```

#### **3. PERMISSÕES & HIERARQUIA DE USUÁRIOS**

```
✅ Roles & Permissions (RBAC)

ROLE: Super Admin (SaaS Owner)
├─ Gerenciar clientes
├─ Gerenciar planos
├─ Ver faturamento
├─ Analytics globais
└─ Configurações do sistema

ROLE: Admin (Cliente)
├─ Gerenciar usuários (criar, editar, deletar)
├─ Gerenciar departamentos
├─ Gerenciar permissões
├─ Configurar automações
├─ Acessar relatórios completos
├─ Gerenciar integrações
└─ Configurações do cliente

ROLE: Supervisor
├─ Gerenciar equipes
├─ Ver relatórios de equipe
├─ Reatribuir tickets
├─ Ver analytics da equipe
├─ Aprovar respostas templates
└─ Monitorar performance

ROLE: Atendente
├─ Responder tickets
├─ Ver histórico contato
├─ Usar templates
├─ Adicionar notas
├─ Transferir (mesma categoria)
└─ Ver próprias métricas

ROLE: Visualizador
├─ Ver conversas
├─ Ver histórico
├─ Ver relatórios (leitura)
├─ Exportar (PDF, CSV)
└─ Nenhuma ação

✅ Permissões Granulares
├─ fila.visualizar
├─ fila.responder
├─ fila.transferir
├─ fila.fechar
├─ fila.abrir
├─ usuarios.criar
├─ usuarios.editar
├─ usuarios.deletar
├─ relatorios.acessar
├─ automacoes.criar
├─ automacoes.editar
├─ templates.gerenciar
├─ configuracoes.acessar
└─ integrações.gerenciar

✅ Auditoria de Permissões
├─ Log de quem acessou o quê
├─ Log de mudanças
├─ Quem deletou/editou contato
├─ Quem leu mensagem sensível
└─ Exportar auditoria
```

#### **4. PLANOS & BILLING (Multi-tenant)**

```
✅ Planos Pré-definidos

PLANO: Básico ($99/mês)
├─ 1 usuário
├─ 1000 mensagens/mês
├─ 1 departamento
├─ Histórico 30 dias
├─ Sem relatórios
├─ Sem automações
└─ Suporte email

PLANO: Profissional ($299/mês)
├─ 5 usuários
├─ 10.000 mensagens/mês
├─ 3 departamentos
├─ Histórico 90 dias
├─ Relatórios básicos
├─ Automações simples
├─ Chat suporte
└─ Templates de resposta

PLANO: Enterprise ($999/mês)
├─ Usuários ilimitados
├─ Mensagens ilimitadas
├─ Departamentos ilimitados
├─ Histórico ilimitado
├─ Todos os relatórios
├─ Automações avançadas
├─ Prioridade suporte
├─ API access
├─ Customizações
└─ Dedicated account manager

✅ Billing System
├─ Stripe/PayPal integration
├─ Faturamento automático
├─ Recibos automáticos
├─ Invoice tracking
├─ Histórico de pagamentos
├─ Upgrade/downgrade automático
├─ Cancelamento com aviso
├─ Créditos e descontos
├─ Cupons promocionais
└─ Retry automático falhas

✅ Controle de Uso
├─ Dashboard uso mensal
├─ Alertas quando atingir 80%
├─ Limite hard quando atingir 100%
├─ Overage charges (opcional)
├─ Histórico de uso diário
└─ Projeção de uso
```

#### **5. SEGURANÇA & LGPD**

```
✅ Criptografia
├─ SSL/TLS em trânsito
├─ AES-256 em repouso
├─ Hashing de senhas (bcrypt)
├─ Criptografia end-to-end opcional
├─ Tokens JWT seguros
├─ Rate limiting em APIs
├─ SQL injection prevention
└─ XSS prevention

✅ Autenticação
├─ 2FA (SMS, authenticator app)
├─ Login com Google/Microsoft
├─ Password reset seguro
├─ Sessão timeout automático
├─ Biometria (opcional)
├─ Whitelist de IPs (enterprise)
├─ Device management
└─ Login history

✅ LGPD Compliance
├─ Consentimento explícito de armazenamento
├─ Direito ao esquecimento (GDPR right to be forgotten)
├─ Deletar contato + dados
├─ Exportar dados (GDPR Data Portability)
├─ Política de privacidade integrada
├─ Cookie consent
├─ Data retention policy (automático)
├─ Relatório de conformidade LGPD
├─ Audit trail completo
├─ DPA (Data Processing Agreement)
└─ Backup & recovery

✅ Segurança de Dados
├─ Backup diário automático
├─ Encriptação de backups
├─ Disaster recovery plan
├─ Replicação em múltiplas regiões
├─ Monitoramento 24/7
├─ Alertas de anomalia
├─ Verificação de integridade
└─ Teste de segurança mensal
```

---

### **TIER 2: IMPORTANTE - Semana 5-6 (25 horas)**

#### **6. AUTOMAÇÕES & WORKFLOWS**

```
✅ Chatbot/Auto-Response
├─ Trigger: Mensagem recebida (sem agente)
├─ Response: Template automático
├─ Delay: Esperar X segundos antes responder
├─ Conditions: Se contém palavra-chave
├─ Actions:
│  ├─ Enviar mensagem
│  ├─ Criar ticket
│  ├─ Atribuir agente
│  ├─ Adicionar tag
│  ├─ Enviar para fila
│  └─ Escalação
├─ Visual workflow builder
├─ A/B testing de respostas
└─ Disable quando agente online

✅ Workflow Automático
├─ Trigger: Evento (novo ticket, 72h sem resposta, etc)
├─ Conditions: Se X, então Y
├─ Actions em sequência
├─ Delays e timeouts
├─ Email notifications
├─ SMS notifications
├─ Webhook para integração
├─ Loop conditions
└─ Logging de execução

✅ Regras de Roteamento
├─ Se palavras-chave, ir para depto X
├─ Se cliente VIP, ir para supervisor
├─ Se fora de horário, ir para fila atendimento
├─ Se contém "urgente", priorizar
├─ Horário comercial vs fora de horário
├─ Balanceamento de carga
├─ Atribuição por skill
└─ Reatribuição automática

✅ Triggers Automáticos
├─ Novo ticket → Notificar agente
├─ 1h sem resposta → Lembrete agente
├─ 24h sem resposta → Escalar
├─ Cliente VIP mensageia → Notificar gerente
├─ Feedback negativo → Escalar
├─ Após fechar ticket → Enviar pesquisa satisfação
├─ Birthday contato → Enviar mensagem
└─ Aniversário → Enviar cupom
```

#### **7. TEMPLATES & MENSAGENS PRONTAS**

```
✅ Template System
├─ Criar categoria de templates
├─ Template de boas-vindas
├─ Template de despedida
├─ Template por departamento
├─ Template por tipo de problema
├─ Template de confirmação
├─ Template de agradecimento
├─ Aprox 50-100 templates padrão
└─ Atualização versão templates

✅ Personalização
├─ Variáveis {nome}, {email}, {telefone}
├─ Variáveis customizadas
├─ Emojis e formatação
├─ Imagens e mídia
├─ Botões com links
├─ Respostas rápidas (keyboard)
├─ Tamanho caracteres limite
└─ Preview antes enviar

✅ Smart Responses
├─ Sugerir template baseado em mensagem
├─ IA detecta intenção (reclamação, dúvida, etc)
├─ Sugerir top 3 templates relevantes
├─ Aprendre padrões de resposta
└─ Feedback se template foi útil

✅ Biblioteca de Avisos
├─ Aviso: Estamos fora de horário
├─ Aviso: Tempo de atendimento pode aumentar
├─ Aviso: Sistema em manutenção
├─ Aviso: Promoção especial
├─ Aviso: Nova feature lançada
├─ Avisos por departamento
├─ Avisos por horário
└─ Frequência máxima (não spam)

✅ Canned Responses (Respostas Rápidas)
├─ Keyboard com 6-10 respostas
├─ Customizável por agente
├─ Compartilhar com equipe
├─ Ranking de uso
├─ A/B testing
└─ Performance tracking
```

#### **8. RELATÓRIOS & ANALYTICS**

```
✅ Dashboard Principal
├─ Tickets abertos
├─ Tempo médio resposta
├─ Taxa de resolução
├─ Satisfação cliente (NPS/Rating)
├─ Atendentes online
├─ Tickets por depto
├─ Tickets por prioridade
└─ Gráfico de volume por dia

✅ Relatório de Agente
├─ Tickets resolvidos
├─ Tempo médio resposta
├─ Rating médio do cliente
├─ Satisfação (NPS)
├─ Mensagens por hora
├─ Tickets mais complexos
├─ Tempo de espera médio
├─ Taxa de reaberturas
├─ Comparação com equipe
└─ Meta de atendimentos

✅ Relatório de Departamento
├─ Total de tickets
├─ Tempo médio resolução
├─ % tickets resolvidos no primeiro contato
├─ Volume por hora/dia/semana
├─ Distribuição por agente
├─ Canais de entrada (WhatsApp, email, chat)
├─ Problemas mais comuns
├─ SLA compliance
└─ ROI por departamento

✅ Relatório de Cliente
├─ Histórico de interações
├─ Valor total gasto
├─ NPS (Net Promoter Score)
├─ Rating por ticket
├─ Tendência satisfação
├─ Ticket count
├─ Tempo médio resolução
└─ Problemas mais frequentes

✅ Relatório Financeiro
├─ Receita por cliente
├─ Receita por plano
├─ Churn rate
├─ LTV (Life Time Value)
├─ CAC (Customer Acquisition Cost)
├─ Margem por cliente
├─ Crescimento mês a mês
├─ Projeção revenue
└─ Relatório imposto (LGPD compliance)

✅ Gráficos & Exportação
├─ Gráfico de barras
├─ Gráfico de linha
├─ Gráfico de pizza
├─ Gráfico de funil
├─ Heatmap de horários
├─ Calendário de atividades
├─ Exportar PDF
├─ Exportar Excel
├─ Exportar CSV
└─ Agendamento automático (email diário/semanal/mensal)

✅ Preditivos & IA
├─ Prever churn
├─ Prever volume
├─ Detectar agente underperforming
├─ Detectar contato VIP
├─ Recomendar ações
└─ Anomaly detection
```

---

### **TIER 3: AVANÇADO - Semana 7-8 (30 horas)**

#### **9. INTEGRAÇÕES & APIs**

```
✅ Integrações Nativas
├─ Stripe (pagamentos)
├─ Google Workspace
├─ Microsoft 365
├─ Slack (notificações)
├─ Zapier (automações)
├─ Make.com (workflows)
├─ Calendly (agendamentos)
├─ HubSpot CRM (data sync)
├─ Salesforce (data sync)
├─ Zoho (data sync)
├─ Google Sheets (import/export)
├─ Shopify (e-commerce)
├─ WooCommerce
├─ Mailchimp (email marketing)
├─ Twilio (SMS)
├─ SendGrid (email)
├─ Intercom (chat)
├─ Freshdesk (tickets)
└─ Instagram & Facebook Messenger

✅ Public API
├─ REST API (full CRUD)
├─ GraphQL (opcional)
├─ WebSocket para real-time
├─ Rate limiting (1000 req/min)
├─ API keys + OAuth2
├─ API documentation (Swagger/OpenAPI)
├─ Webhooks (eventos)
├─ SDK (Node.js, Python, Ruby, PHP, Go)
└─ Sandbox para testar

✅ Webhooks
├─ novo_ticket
├─ ticket_respondido
├─ ticket_fechado
├─ ticket_transferido
├─ nota_adicionada
├─ contato_criado
├─ contato_deletado
├─ usuario_online
├─ usuario_offline
└─ mensagem_recebida

✅ Sincronização de Dados
├─ Sync unidirecional (importar)
├─ Sync bidirecional (HubSpot, Salesforce)
├─ Mapeamento de campos
├─ Conflito resolution
├─ Sincronização agendada (daily, hourly)
├─ Manual sync
├─ Audit log de sync
└─ Rollback de erros
```

#### **10. MULTI-AGENT & COLLABORATION**

```
✅ Colaboração em Ticket
├─ Atribuir para múltiplos agentes
├─ Comentários internos (não visíveis cliente)
├─ @mention para chamar agente
├─ Typing indicator em tempo real
├─ Ver quem está editando resposta
├─ Histórico de revisões
├─ Aprovação antes enviar (workflow)
├─ Historico de quem respondeu
└─ Lock ticket para edição exclusiva

✅ Equipes e Departamentos
├─ Criar departamentos
├─ Atribuir agentes a departamentos
├─ Permissões por departamento
├─ Chefe de departamento
├─ Metas por departamento
├─ Performance por depto
├─ Horário por depto
├─ Fila por depto
└─ Transferência automática entre depto

✅ Status Online/Offline
├─ Online (disponível)
├─ Ocupado (não recebe tickets automáticos)
├─ Pausa (almoço, reunião)
├─ Offline (não online)
├─ Auto-status após X tempo inativo
├─ Status em calendário
├─ Visibility (quem vê status)
└─ Notificação quando fica online
```

#### **11. ANÁLISE AVANÇADA & IA**

```
✅ Sentiment Analysis
├─ Detectar sentimento (positivo, negativo, neutro)
├─ Confiança do sentimento (%)
├─ Histórico de sentimento por contato
├─ Alertar se muito negativo
├─ Tendência de sentimento
├─ Palavras gatilho (negativo)
└─ Sugerir resposta empática

✅ Intent Detection
├─ Detectar intenção: Reclamação, Dúvida, Sugestão, etc
├─ Categorizar automaticamente
├─ Sugerir departamento certo
├─ Sugerir template de resposta
├─ Aprendizado contínuo
└─ Performance de detecção

✅ Summarization & Insights
├─ Resumir conversa automática
├─ Extrair pontos-chave
├─ Identificar problema principal
├─ Sugerir solução
├─ Gerar tags automáticas
├─ Análise de causa-raiz
└─ Recomendação de ação

✅ Predictive Analytics
├─ Prever churn (contato vai sair?)
├─ Prever CSAT (vai gostar do atendimento?)
├─ Prever volume próximo mês
├─ Prever tickets complexos
├─ Identificar padrão de problema
├─ Sugerir melhorias
└─ Score de risco cliente

✅ Quality Assurance
├─ Auditar conversas (sampling ou 100%)
├─ Checklist de qualidade
├─ Score de qualidade por agente
├─ Feedback automático
├─ Coaching points
├─ Performance trend
├─ Comparação com padrão
└─ Certificação de qualidade
```

#### **12. AGENDAMENTO & CALENDÁRIO**

```
✅ Agendamento de Atendimento
├─ Calendário integrado
├─ Disponibilidade dos agentes
├─ Timezone automático
├─ Blocos de tempo por agente
├─ Confirmar agendamento (SMS/WhatsApp)
├─ Lembretes automáticos (1h antes)
├─ Cancelamento com notificação
├─ Rescheduling automático
├─ Buffer entre atendimentos
└─ Histórico de agendamentos

✅ Agendamento de Envio
├─ Agendar envio de mensagem
├─ Envio em horário específico
├─ Envio recorrente (daily, weekly, etc)
├─ Envio para múltiplos contatos
├─ Template + personalização
├─ Confirmar antes enviar
├─ Audit log de envios
└─ Analytics de envio

✅ Disponibilidade & Horários
├─ Horário comercial (seg-sex 9-18h)
├─ Horário de funcionamento por depto
├─ Timezone por agente
├─ Feriados (não atender)
├─ Plantão noturno
├─ Cobertura 24/7
├─ Auto-resposta fora de horário
└─ Sugerir melhor horário (bot)
```

---

### **TIER 4: NICHOS - NICE TO HAVE - Semana 9+ (20+ horas)**

#### **13. FEEDBACK & SATISFAÇÃO**

```
✅ NPS (Net Promoter Score)
├─ Pesquisa automática após ticket
├─ Escala 0-10
├─ Pergunta aberta para resposta
├─ Cálculo NPS automático
├─ Histórico NPS por agente
├─ Histórico NPS por depto
├─ Identificar promoters vs detractors
├─ Ação automática (detractors)
└─ Email follow-up para detractors

✅ CSAT (Customer Satisfaction)
├─ Thumbs up/down
├─ Estrela 1-5
├─ Smiley scale
├─ Média por agente
├─ Tendência CSAT
├─ Alertar se baixo
└─ Comparação time

✅ Pesquisa de Satisfação
├─ Customizável (criar perguntas)
├─ Múltiplas respostas
├─ Condicional (se X, perguntar Y)
├─ Enviar pós-ticket
├─ Enviar em horário específico
├─ Template de survey
├─ Analytics de survey
└─ Exportar respostas

✅ Feedback Loop
├─ Coletar feedback
├─ Analisar padrões
├─ Identificar melhorias
├─ Compartilhar com time
├─ Ação corretiva automática
├─ Follow-up com cliente
└─ Resultado de implementação
```

#### **14. CONHECIMENTO & BASE DE ARTIGOS**

```
✅ Knowledge Base
├─ Criar categorias de artigos
├─ Escrever artigos
├─ Versioning de artigos
├─ Rascunho vs publicado
├─ Busca full-text
├─ Sugerir artigo ao cliente
├─ Auto-resposta com link de artigo
├─ Analytics de artigos (visualizações)
├─ Rating de utilidade
├─ Feedback em artigo
└─ Correlação com tickets

✅ FAQ automática
├─ Extrair de conversas
├─ Popular de templates
├─ Sincronizar com knowledge base
├─ Atualizar FAQ
└─ Analytics de FAQ

✅ SOP (Standard Operating Procedure)
├─ Criar procedimentos
├─ Passo-a-passo visual
├─ Vídeos tutoriais
├─ Checklist
├─ Atribuir SOP a agente
└─ Compliance tracking
```

#### **15. INTELIGÊNCIA COMPETITIVA**

```
✅ Análise de Concorrência
├─ Monitorar menção de competitors
├─ Analisar sentiment sobre competitor
├─ Criar alert se mencionado
├─ Sugerir resposta
├─ Oferecer alternativa
└─ Histórico de menções

✅ Análise de Mercado
├─ Acompanhar tendências
├─ Identificar oportunidades
├─ Alertar sobre mudanças
└─ Recomendações de ação
```

#### **16. SOCIAL MEDIA INTEGRATIONS**

```
✅ Multi-Channel
├─ WhatsApp (primary)
├─ Instagram DMs
├─ Facebook Messenger
├─ Telegram
├─ SMS
├─ Email
├─ Live Chat
├─ Tik Tok DMs (se aplicável)
└─ LinkedIn Messenger

✅ Unified Inbox
├─ Todas as conversas em um lugar
├─ Identificar canal
├─ Responder direto em inbox
├─ Sincronizar em tempo real
├─ Histórico multi-channel
└─ Preferência de contato
```

---

## 🏗️ REFATORAÇÃO DO PROJETO

### **Estrutura de Banco de Dados (Novo Schema)**

```sql
-- CLIENTES & PLANOS
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  plano_id INT REFERENCES planos(id),
  status ENUM('ativo', 'cancelado', 'suspenso'),
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_cancelamento TIMESTAMP,
  criado_por INT REFERENCES usuarios(id)
);

CREATE TABLE planos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100), -- 'Basico', 'Profissional', 'Enterprise'
  preco DECIMAL(10, 2),
  usuarios_limite INT,
  mensagens_limit INT,
  departamentos_limit INT,
  features JSONB, -- ['templates', 'automacoes', 'relatorios']
  descricao TEXT
);

-- USUARIOS & PERMISSÕES
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  nome VARCHAR(255),
  avatar_url VARCHAR(255),
  role_id INT REFERENCES roles(id),
  status ENUM('ativo', 'inativo', 'suspenso'),
  ultimo_login TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id),
  nome VARCHAR(100), -- 'admin', 'supervisor', 'atendente', 'visualizador'
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE role_permissoes (
  role_id INT REFERENCES roles(id),
  permissao_id INT REFERENCES permissoes(id),
  PRIMARY KEY (role_id, permissao_id)
);

CREATE TABLE permissoes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100), -- 'fila.visualizar', 'fila.responder'
  descricao TEXT,
  categoria VARCHAR(50), -- 'fila', 'usuarios', 'relatorios'
  criado_em TIMESTAMP DEFAULT NOW()
);

-- CONTATOS & CONVERSAS
CREATE TABLE contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id INT REFERENCES clientes(id),
  telefone VARCHAR(20) UNIQUE,
  nome VARCHAR(255),
  email VARCHAR(255),
  tags JSONB, -- ['vip', 'reclamação', 'venda']
  notas TEXT,
  avatar_url VARCHAR(255),
  fonte ENUM('whatsapp', 'manual', 'importado', 'api'),
  ltv DECIMAL(10, 2), -- Life Time Value
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id INT REFERENCES clientes(id),
  contato_id UUID REFERENCES contatos(id),
  titulo VARCHAR(255),
  status ENUM('novo', 'aberto', 'respondendo', 'fechado', 'reaberto'),
  prioridade ENUM('baixa', 'normal', 'alta', 'critica'),
  departamento_id INT REFERENCES departamentos(id),
  atribuido_para INT REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT NOW(),
  respondido_em TIMESTAMP,
  fechado_em TIMESTAMP,
  tempo_resolucao INT, -- minutos
  sla_breach BOOLEAN,
  tags JSONB,
  satisfacao_rating INT CHECK (satisfacao_rating BETWEEN 1 AND 5),
  nps INT CHECK (nps BETWEEN 0 AND 10),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  usuario_id INT REFERENCES usuarios(id),
  contato_id UUID REFERENCES contatos(id),
  conteudo TEXT,
  tipo ENUM('texto', 'imagem', 'arquivo', 'audio', 'video'),
  url_midia VARCHAR(255),
  eh_template BOOLEAN,
  template_id INT REFERENCES templates(id),
  privada BOOLEAN, -- nota interna
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- AUTOMAÇÕES & TEMPLATES
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id),
  categoria VARCHAR(100),
  titulo VARCHAR(255),
  conteudo TEXT,
  variaveis JSONB, -- {nome}, {email}
  criado_por INT REFERENCES usuarios(id),
  uso_count INT DEFAULT 0,
  rating DECIMAL(3,2),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE automacoes (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id),
  nome VARCHAR(255),
  trigger VARCHAR(50), -- 'nova_mensagem', 'sem_resposta_24h'
  condicoes JSONB, -- {"contains": "urgente"}
  acoes JSONB, -- [{"type": "enviar_template", "template_id": 1}]
  ativa BOOLEAN,
  criado_por INT REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- RELATÓRIOS & ANALYTICS
CREATE TABLE relatorios_agente (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  data DATE,
  tickets_respondidos INT,
  tempo_medio_resposta INT,
  csat_medio DECIMAL(3,2),
  nps_medio INT,
  mensagens_sent INT,
  tempo_medio_online INT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE relatorios_depto (
  id SERIAL PRIMARY KEY,
  departamento_id INT REFERENCES departamentos(id),
  data DATE,
  total_tickets INT,
  tempo_medio_resolucao INT,
  primeiro_contato_rate DECIMAL(5,2),
  sla_compliance DECIMAL(5,2),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- AUDITORIA & SEGURANÇA
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  cliente_id INT REFERENCES clientes(id),
  acao VARCHAR(100), -- 'create', 'update', 'delete', 'view'
  tabela VARCHAR(50),
  registro_id VARCHAR(255),
  mudancas JSONB, -- {"antes": {...}, "depois": {...}}
  ip_address INET,
  user_agent TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE security_events (
  id BIGSERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  evento VARCHAR(100), -- 'login', 'failed_login', 'permission_denied'
  detalhes JSONB,
  ip_address INET,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- BILLING & TRANSAÇÕES
CREATE TABLE transacoes (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id),
  tipo ENUM('charge', 'refund', 'credit'),
  valor DECIMAL(10, 2),
  status ENUM('pending', 'completed', 'failed'),
  stripe_id VARCHAR(255),
  invoice_url VARCHAR(255),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE avisos_sistema (
  id SERIAL PRIMARY KEY,
  cliente_id INT REFERENCES clientes(id),
  tipo VARCHAR(50), -- 'fora_horario', 'manutencao', 'promocao'
  mensagem TEXT,
  ativo BOOLEAN,
  criado_em TIMESTAMP DEFAULT NOW()
);
```

---

## 📈 NOVO PLANO DE TRABALHO (Completo)

### **Semana 3: MVP CORE (Hoje - Em andamento)**
- ✅ FASE 3.0: Refatoração BD + API
- ✅ FASE 3.1: Socket.io Backend
- ✅ FASE 3.2: React Setup
- ✅ FASE 3.3: Admin Dashboard
- ✅ FASE 3.4: Cliente Dashboard
- ✅ FASE 3.5: Testes E2E

**Total: 7 horas** ✅

---

### **Semana 4: AUTENTICAÇÃO + PERMISSÕES (8 horas)**

**FASE 4.1: Sistema de Permissões Completo**
- Migrations: Roles, Permissões, Role_Permissões
- Models: Role, Permissao, RolePermissao
- Backend: Middleware verificarPermissao()
- Testes: +20 testes

**FASE 4.2: Painel Admin de Permissões**
- Página: /admin/permissoes
- Componentes: RolesManager, PermissoesGrid
- CRUD de roles
- CRUD de permissões
- Atribuir permissões a roles
- Testes: +15 testes

---

### **Semana 5: PLANOS & BILLING (10 horas)**

**FASE 5.1: Sistema de Planos**
- Models: Plano, Transacao
- Admin page: Gerenciar planos
- Definir planos padrão (Básico, Profissional, Enterprise)
- Controle de features por plano

**FASE 5.2: Billing Integrado**
- Stripe integration
- Checkout automático
- Faturamento mensal
- Invoices e recibos
- Upgrade/downgrade de planos
- Cancelamento com aviso

**FASE 5.3: Controle de Uso**
- Dashboard de uso
- Alertas de limite
- Overage charges
- Histórico de uso

---

### **Semana 6: SEGURANÇA & LGPD (12 horas)**

**FASE 6.1: Autenticação Avançada**
- 2FA (SMS + Authenticator)
- Login com Google/Microsoft
- Biometria (face/fingerprint)
- Whitelist de IPs

**FASE 6.2: Criptografia & LGPD**
- AES-256 em repouso
- SSL/TLS em trânsito
- Hashing de senhas (bcrypt)
- Right to be forgotten
- Data portability (GDPR)
- Política de retenção automática
- Audit trail completo

**FASE 6.3: Backup & Disaster Recovery**
- Backup diário automático
- Encriptação de backups
- Replicação multi-região
- Recovery plan testado

---

### **Semana 7: AUTOMAÇÕES (15 horas)**

**FASE 7.1: Chatbot & Auto-Response**
- Trigger system
- Conditions builder
- Action system
- Visual workflow builder
- Template suggestions (IA)
- A/B testing de respostas

**FASE 7.2: Workflows Automáticos**
- Complex conditions
- Multi-step actions
- Delays e timeouts
- Notifications (email/SMS)
- Webhooks

**FASE 7.3: Smart Routing**
- Roteamento por palavras-chave
- Roteamento por departamento
- Balanceamento de carga
- Atribuição por skill
- SLA tracking

---

### **Semana 8: TEMPLATES & AVISOS (8 horas)**

**FASE 8.1: Template System**
- CRUD de templates
- Categorização
- Variáveis e personalização
- Emojis, imagens, botões
- Smart suggestions (IA)

**FASE 8.2: Biblioteca de Avisos**
- Avisos pré-definidos
- Customização
- Agendamento
- Analytics

**FASE 8.3: Canned Responses**
- Keyboard de respostas rápidas
- A/B testing
- Performance tracking

---

### **Semana 9: RELATÓRIOS & ANALYTICS (15 horas)**

**FASE 9.1: Dashboard Principal**
- Métricas KPI
- Gráficos em tempo real
- Filtros avançados
- Exportação (PDF, Excel)

**FASE 9.2: Relatórios Específicos**
- Relatório de Agente
- Relatório de Departamento
- Relatório de Cliente
- Relatório Financeiro

**FASE 9.3: IA & Predictivos**
- Sentiment analysis
- Intent detection
- Churn prediction
- Anomaly detection
- Quality scoring

---

### **Semana 10: INTEGRAÇÕES (12 horas)**

**FASE 10.1: API Pública**
- REST API completa
- OAuth2 + API keys
- Webhooks
- SDKs (Node.js, Python, etc)
- Rate limiting

**FASE 10.2: Integrações Nativas**
- Stripe (pronto)
- Slack, Google Workspace, Microsoft 365
- Zapier/Make.com
- Mailchimp, SendGrid
- Shopify, WooCommerce

**FASE 10.3: Multi-channel**
- Instagram DMs
- Facebook Messenger
- Telegram
- SMS
- Email
- Live Chat

---

### **Semana 11: COLABORAÇÃO & QUALIDADE (10 horas)**

**FASE 11.1: Multi-agent Collaboration**
- Atribuição múltipla
- Comentários internos
- @mentions
- Typing indicator
- Histórico de revisões

**FASE 11.2: Quality Assurance**
- Audit sampling
- Scoring
- Coaching points
- Compliance tracking

---

### **Semana 12: AGENDAMENTO & FEEDBACK (10 horas)**

**FASE 12.1: Agendamento**
- Calendário integrado
- Confirmação automática
- Lembretes (SMS/WhatsApp)
- Agendamento de envios

**FASE 12.2: Feedback & Satisfação**
- NPS survey
- CSAT survey
- Pesquisas customizadas
- Feedback loop

---

### **Semana 13: DEPLOY & DOCUMENTAÇÃO (10 horas)**

**FASE 13.1: Deploy em Railway**
- Setup ambiente production
- Banco de dados production
- SSL/TLS certificados
- CDN para assets
- Monitoring e alertas

**FASE 13.2: Documentação**
- README completo
- API documentation (Swagger)
- User guides
- Admin guides
- Video tutorials

**FASE 13.3: Testes de Carga**
- Stress testing
- Performance optimization
- Database tuning
- Caching strategy

---

## 📊 RESUMO FINAL

```
TOTAL DE HORAS: 125 horas
TEMPO EM SEMANAS: 13 semanas (3 meses)

ARQUITETURA:
✅ Monorepo (backend + frontend + shared)
✅ Multi-tenant (completo)
✅ RBAC (roles + permissões granulares)
✅ Billing (Stripe integrado)
✅ LGPD compliant
✅ API pública (REST + webhooks)
✅ Multi-channel (WhatsApp + 6 outros)
✅ IA/ML (sentiment, intent, predictives)
✅ Real-time (Socket.io)
✅ Analytics completos
✅ Quality assurance

TECNOLOGIA:
Backend: Node.js + Express + PostgreSQL + Socket.io
Frontend: React + Vite + TypeScript + Tailwind
Deploy: Railway + Docker
Segurança: JWT + 2FA + AES-256
IA: Claude API para análises

CUSTOS (Estimado):
- Railway: $50-200/mês
- Stripe: 2.9% + $0.30 por transação
- Claude API: $0.003/1K input + $0.015/1K output
- Baileys WhatsApp: Gratuito
- Domínio: $12/ano
- Email: Free tier SendGrid

RECEITA (Estimado):
- Plano Básico: $99/mês × 50 clientes = $4.950/mês
- Plano Profissional: $299/mês × 20 clientes = $5.980/mês
- Plano Enterprise: $999/mês × 5 clientes = $4.995/mês
- TOTAL: ~$15.925/mês = $191.100/ano ✅

Margem bruta: ~95% (custos mínimos)
Break-even: ~100 clientes
```

---

## 🎯 DECISÃO

**Você quer:**

> **A) Seguir com MVP (Semana 3-4) e depois expandir**

OU

> **B) Refatorar TUDO agora para ser CRM profissional desde o início**

---

**Qual você escolhe?** 🤔
