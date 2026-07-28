'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

// Números únicos para testes de atendimento (5585992*)
const NUM_1 = '5585992010001';
const NUM_2 = '5585992010002';
const NUM_3 = '5585992010003';
const NUM_4 = '5585992010004';

// UUID que não existe no banco — simula acesso a recurso de outro tenant/inexistente
const FAKE_ID = '00000000-0000-4000-8000-000000000099';

// Usuários disponíveis no seed (todos do cliente 1)
//   tokenAdmin    → admin@cliente1.com   (role: admin)
//   tokenAtendente → ana@cliente1.com    (role: atendente)
let tokenAdmin, tokenAtendente;
let atendimentoIdAdmin, atendimentoIdAtendente, atendimentoParaEncerrar;

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  await sequelize.query(`DELETE FROM message_queue WHERE atendimento_id IN (SELECT id FROM atendimentos WHERE numero_whatsapp LIKE '5585992%')`);
  await sequelize.query(`DELETE FROM atendimentos WHERE numero_whatsapp LIKE '5585992%'`);

  [tokenAdmin, tokenAtendente] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email,     CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ATENDENTE_C1.email, CREDENTIALS.ATENDENTE_C1.senha),
  ]);
});

afterAll(async () => {
  await sequelize.query(`DELETE FROM message_queue WHERE atendimento_id IN (SELECT id FROM atendimentos WHERE numero_whatsapp LIKE '5585992%')`);
  await sequelize.query(`DELETE FROM atendimentos WHERE numero_whatsapp LIKE '5585992%'`);
});

// ── Auth guards ───────────────────────────────────────────────────────────────

describe('Auth — Atendimento endpoints requerem autenticação', () => {
  it('GET /api/atendimento/status retorna 401 sem token', async () => {
    const res = await request(app).get('/api/atendimento/status');
    expect(res.status).toBe(401);
  });

  it('GET /api/atendimento/fila retorna 401 sem token', async () => {
    const res = await request(app).get('/api/atendimento/fila');
    expect(res.status).toBe(401);
  });

  it('POST /api/atendimento/receber retorna 401 sem token', async () => {
    const res = await request(app)
      .post('/api/atendimento/receber')
      .send({ numero: NUM_1, mensagem: 'test' });
    expect(res.status).toBe(401);
  });

  it('GET /api/atendimento/stats/dashboard retorna 401 sem token', async () => {
    const res = await request(app).get('/api/atendimento/stats/dashboard');
    expect(res.status).toBe(401);
  });

  it('POST /api/atendimento/chatbot/analisar retorna 401 sem token', async () => {
    const res = await request(app)
      .post('/api/atendimento/chatbot/analisar')
      .send({ mensagem: 'test' });
    expect(res.status).toBe(401);
  });
});

// ── Receber mensagem (cria atendimento) ───────────────────────────────────────

describe('Receber — cria atendimento ao receber mensagem', () => {
  it('POST /api/atendimento/receber retorna 400 sem numero', async () => {
    const res = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenAdmin))
      .send({ mensagem: 'Olá' });
    expect(res.status).toBe(400);
  });

  it('POST /api/atendimento/receber retorna 400 sem mensagem', async () => {
    const res = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenAdmin))
      .send({ numero: NUM_1 });
    expect(res.status).toBe(400);
  });

  it('POST /api/atendimento/receber cria atendimento com analise', async () => {
    const res = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenAdmin))
      .send({ numero: NUM_1, mensagem: 'Preciso de ajuda urgente com problema no sistema' });
    expect(res.status).toBe(201);
    expect(res.body.atendimento).toBeDefined();
    expect(res.body.analise).toBeDefined();
    expect(res.body.atendimento.numero_whatsapp).toBe(NUM_1);
    expect(res.body.atendimento.status).toBe('pendente');
    expect(['positivo', 'neutro', 'negativo']).toContain(res.body.analise.sentimento);
    expect(['alta', 'media', 'baixa']).toContain(res.body.analise.urgencia);
    atendimentoIdAdmin = res.body.atendimento.id;
  });

  it('POST /api/atendimento/receber reutiliza atendimento pendente do mesmo número', async () => {
    const res = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenAdmin))
      .send({ numero: NUM_1, mensagem: 'Segunda mensagem' });
    expect(res.status).toBe(201);
    // Deve reutilizar o mesmo atendimento (mesmo id)
    expect(res.body.atendimento.id).toBe(atendimentoIdAdmin);
  });

  it('POST /api/atendimento/receber por atendente cria atendimento independente', async () => {
    const res = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenAtendente))
      .send({ numero: NUM_2, mensagem: 'Olá, quero informações' });
    expect(res.status).toBe(201);
    expect(res.body.atendimento).toBeDefined();
    expect(res.body.atendimento.numero_whatsapp).toBe(NUM_2);
    atendimentoIdAtendente = res.body.atendimento.id;
  });
});

// ── Chatbot ───────────────────────────────────────────────────────────────────

describe('Chatbot — análise de mensagens', () => {
  it('POST /api/atendimento/chatbot/analisar retorna 400 sem mensagem', async () => {
    const res = await request(app)
      .post('/api/atendimento/chatbot/analisar')
      .set(authHeaders(tokenAdmin))
      .send({});
    expect(res.status).toBe(400);
  });

  it('detecta sentimento negativo em mensagem de reclamação', async () => {
    const res = await request(app)
      .post('/api/atendimento/chatbot/analisar')
      .set(authHeaders(tokenAdmin))
      .send({ mensagem: 'O serviço está péssimo, muita demora e erro no sistema' });
    expect(res.status).toBe(200);
    expect(res.body.sentimento).toBe('negativo');
  });

  it('detecta sentimento positivo em mensagem de elogio', async () => {
    const res = await request(app)
      .post('/api/atendimento/chatbot/analisar')
      .set(authHeaders(tokenAdmin))
      .send({ mensagem: 'Ótimo atendimento, obrigado, perfeito!' });
    expect(res.status).toBe(200);
    expect(res.body.sentimento).toBe('positivo');
  });

  it('detecta urgência alta quando mensagem contém "urgente"', async () => {
    const res = await request(app)
      .post('/api/atendimento/chatbot/analisar')
      .set(authHeaders(tokenAdmin))
      .send({ mensagem: 'É urgente, preciso resolver agora' });
    expect(res.status).toBe(200);
    expect(res.body.urgencia).toBe('alta');
  });

  it('retorna intent, sentimento, urgencia e palavras_chave', async () => {
    const res = await request(app)
      .post('/api/atendimento/chatbot/analisar')
      .set(authHeaders(tokenAdmin))
      .send({ mensagem: 'Quero comprar um produto, qual o preço?' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sentimento');
    expect(res.body).toHaveProperty('urgencia');
    expect(res.body).toHaveProperty('intent');
    expect(Array.isArray(res.body.palavras_chave)).toBe(true);
  });
});

// ── Status ────────────────────────────────────────────────────────────────────

describe('Status — lista atendimentos', () => {
  it('GET /api/atendimento/status retorna array', async () => {
    const res = await request(app)
      .get('/api/atendimento/status')
      .set(authHeaders(tokenAdmin));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/atendimento/status não contém IDs inexistentes (isolamento)', async () => {
    const res = await request(app)
      .get('/api/atendimento/status')
      .set(authHeaders(tokenAdmin));
    expect(res.status).toBe(200);
    const ids = res.body.map((a) => a.id);
    // FAKE_ID nunca deve aparecer na lista do cliente
    expect(ids).not.toContain(FAKE_ID);
  });

  it('GET /api/atendimento/status inclui atendimentos criados por qualquer usuário do cliente', async () => {
    const res = await request(app)
      .get('/api/atendimento/status')
      .set(authHeaders(tokenAdmin));
    expect(res.status).toBe(200);
    const ids = res.body.map((a) => a.id);
    // Ambos os atendimentos (admin e atendente) pertencem ao mesmo cliente
    expect(ids).toContain(atendimentoIdAdmin);
    expect(ids).toContain(atendimentoIdAtendente);
  });

  it('GET /api/atendimento/status filtra por status=pendente', async () => {
    const res = await request(app)
      .get('/api/atendimento/status?status=pendente')
      .set(authHeaders(tokenAdmin));
    expect(res.status).toBe(200);
    res.body.forEach((a) => expect(a.status).toBe('pendente'));
  });
});

// ── Fila ─────────────────────────────────────────────────────────────────────

describe('Fila — lista pendentes', () => {
  it('GET /api/atendimento/fila retorna apenas pendentes', async () => {
    const res = await request(app)
      .get('/api/atendimento/fila')
      .set(authHeaders(tokenAdmin));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((a) => expect(a.status).toBe('pendente'));
  });

  it('Atendente e admin do mesmo cliente veem a mesma fila', async () => {
    const [resAdmin, resAtendente] = await Promise.all([
      request(app).get('/api/atendimento/fila').set(authHeaders(tokenAdmin)),
      request(app).get('/api/atendimento/fila').set(authHeaders(tokenAtendente)),
    ]);
    // Mesma fila (mesmo cliente)
    const idsAdmin     = resAdmin.body.map((a) => a.id).sort();
    const idsAtendente = resAtendente.body.map((a) => a.id).sort();
    expect(idsAdmin).toEqual(idsAtendente);
  });
});

// ── Pegar atendimento ─────────────────────────────────────────────────────────

describe('Pegar — atendente assume atendimento', () => {
  it('POST /:id/pegar retorna 404 para ID inexistente (FAKE_ID)', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${FAKE_ID}/pegar`)
      .set(authHeaders(tokenAdmin));
    expect(res.status).toBe(404);
  });

  it('POST /:id/pegar altera status para ativo', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdAdmin}/pegar`)
      .set(authHeaders(tokenAdmin));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ativo');
    expect(res.body.usuario_id).toBeDefined();
  });

  it('POST /:id/pegar retorna 404 para atendimento já ativo', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdAdmin}/pegar`)
      .set(authHeaders(tokenAdmin));
    expect(res.status).toBe(404);
  });
});

// ── Enviar mensagem ───────────────────────────────────────────────────────────

describe('Mensagem — envio de mensagens', () => {
  it('POST /:id/mensagem retorna 400 sem body mensagem', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdAdmin}/mensagem`)
      .set(authHeaders(tokenAdmin))
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /:id/mensagem retorna 404 para ID inexistente (FAKE_ID)', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${FAKE_ID}/mensagem`)
      .set(authHeaders(tokenAdmin))
      .send({ mensagem: 'test' });
    expect(res.status).toBe(404);
  });

  it('POST /:id/mensagem registra mensagem de saída', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdAdmin}/mensagem`)
      .set(authHeaders(tokenAdmin))
      .send({ mensagem: 'Olá! Como posso ajudar?' });
    expect(res.status).toBe(201);
    expect(res.body.tipo).toBe('saida');
    expect(res.body.mensagem).toBe('Olá! Como posso ajudar?');
    expect(res.body.atendimento_id).toBe(atendimentoIdAdmin);
  });
});

// ── Marcar dados ──────────────────────────────────────────────────────────────

describe('Dados — marcar dados do cliente', () => {
  it('POST /:id/dados retorna 404 para ID inexistente (FAKE_ID)', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${FAKE_ID}/dados`)
      .set(authHeaders(tokenAdmin))
      .send({ nome: 'Test' });
    expect(res.status).toBe(404);
  });

  it('POST /:id/dados mescla dados no atendimento', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdAdmin}/dados`)
      .set(authHeaders(tokenAdmin))
      .send({ nome: 'João Teste', empresa: 'ACME', interesse: 'Produto X' });
    expect(res.status).toBe(200);
    expect(res.body.dados_cliente).toBeDefined();
    expect(res.body.dados_cliente.nome).toBe('João Teste');
    expect(res.body.dados_cliente.empresa).toBe('ACME');
  });

  it('POST /:id/dados merge incremental — não sobrescreve campos anteriores', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdAdmin}/dados`)
      .set(authHeaders(tokenAdmin))
      .send({ telefone: '+5585999999999' });
    expect(res.status).toBe(200);
    expect(res.body.dados_cliente.nome).toBe('João Teste');
    expect(res.body.dados_cliente.telefone).toBe('+5585999999999');
  });
});

// ── Encaminhar para vendas ────────────────────────────────────────────────────

describe('Encaminhar — cria Oportunidade no CRM', () => {
  let estagioId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/vendas/pipeline/estagios')
      .set(authHeaders(tokenAdmin))
      .send({ nome: 'NOVO-ATD', cor: '#06b6d4', ordem: 99 });
    estagioId = res.body?.id;
  });

  afterAll(async () => {
    if (estagioId) {
      await sequelize.query(`DELETE FROM historico_oportunidade WHERE oportunidade_id IN (SELECT id FROM oportunidades WHERE estagio_id = '${estagioId}')`);
      await sequelize.query(`DELETE FROM oportunidades WHERE estagio_id = '${estagioId}'`);
      await sequelize.query(`DELETE FROM estagios_pipeline WHERE id = '${estagioId}'`);
    }
  });

  it('POST /:id/encaminhar retorna 404 para ID inexistente (FAKE_ID)', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${FAKE_ID}/encaminhar`)
      .set(authHeaders(tokenAdmin))
      .send({});
    expect(res.status).toBe(404);
  });

  it('POST /:id/encaminhar cria Oportunidade com titulo padrão', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdAdmin}/encaminhar`)
      .set(authHeaders(tokenAdmin))
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.titulo).toContain(NUM_1);
    expect(res.body.status).toBe('aberta');
  });

  it('POST /:id/encaminhar aceita titulo e valor customizados', async () => {
    const recRes = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenAdmin))
      .send({ numero: NUM_3, mensagem: 'Quero comprar' });
    const novoId = recRes.body.atendimento.id;

    const res = await request(app)
      .post(`/api/atendimento/${novoId}/encaminhar`)
      .set(authHeaders(tokenAdmin))
      .send({ titulo: 'Venda especial', valor: 15000 });
    expect(res.status).toBe(201);
    expect(res.body.titulo).toBe('Venda especial');
    expect(parseFloat(res.body.valor)).toBe(15000);
  });
});

// ── Encerrar ──────────────────────────────────────────────────────────────────

describe('Encerrar — finaliza atendimento', () => {
  beforeAll(async () => {
    const res = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenAdmin))
      .send({ numero: NUM_4, mensagem: 'Atendimento para encerrar' });
    atendimentoParaEncerrar = res.body.atendimento.id;
  });

  it('POST /:id/encerrar retorna 404 para ID inexistente (FAKE_ID)', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${FAKE_ID}/encerrar`)
      .set(authHeaders(tokenAdmin));
    expect(res.status).toBe(404);
  });

  it('POST /:id/encerrar altera status para encerrado', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoParaEncerrar}/encerrar`)
      .set(authHeaders(tokenAdmin));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('encerrado');
  });
});

// ── Feedback ──────────────────────────────────────────────────────────────────

describe('Feedback — avaliação do atendimento', () => {
  it('POST /:id/feedback retorna 400 para score inválido (6)', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoParaEncerrar}/feedback`)
      .set(authHeaders(tokenAdmin))
      .send({ score: 6 });
    expect(res.status).toBe(400);
  });

  it('POST /:id/feedback retorna 400 para score inválido (0)', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoParaEncerrar}/feedback`)
      .set(authHeaders(tokenAdmin))
      .send({ score: 0 });
    expect(res.status).toBe(400);
  });

  it('POST /:id/feedback registra nota 5', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoParaEncerrar}/feedback`)
      .set(authHeaders(tokenAdmin))
      .send({ score: 5 });
    expect(res.status).toBe(200);
    expect(res.body.feedback_score).toBe(5);
  });

  it('POST /:id/feedback retorna 404 para ID inexistente (FAKE_ID)', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${FAKE_ID}/feedback`)
      .set(authHeaders(tokenAdmin))
      .send({ score: 3 });
    expect(res.status).toBe(404);
  });
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

describe('Dashboard — métricas de atendimento', () => {
  it('GET /stats/dashboard retorna estrutura correta', async () => {
    const res = await request(app)
      .get('/api/atendimento/stats/dashboard')
      .set(authHeaders(tokenAdmin));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('pendentes');
    expect(res.body).toHaveProperty('ativos');
    expect(res.body).toHaveProperty('encerrados');
    expect(res.body).toHaveProperty('satisfacao_media');
  });

  it('Admin e atendente do mesmo cliente veem as mesmas métricas', async () => {
    const [resAdmin, resAtendente] = await Promise.all([
      request(app).get('/api/atendimento/stats/dashboard').set(authHeaders(tokenAdmin)),
      request(app).get('/api/atendimento/stats/dashboard').set(authHeaders(tokenAtendente)),
    ]);
    // Mesmo cliente → mesmas métricas
    expect(resAdmin.body.total).toBe(resAtendente.body.total);
    expect(resAdmin.body.encerrados).toBe(resAtendente.body.encerrados);
  });

  it('satisfacao_media reflete feedback registrado', async () => {
    const res = await request(app)
      .get('/api/atendimento/stats/dashboard')
      .set(authHeaders(tokenAdmin));
    expect(res.status).toBe(200);
    expect(res.body.satisfacao_media).not.toBeNull();
    expect(Number(res.body.satisfacao_media)).toBeGreaterThanOrEqual(1);
    expect(Number(res.body.satisfacao_media)).toBeLessThanOrEqual(5);
  });

  it('total = pendentes + ativos + encerrados', async () => {
    const res = await request(app)
      .get('/api/atendimento/stats/dashboard')
      .set(authHeaders(tokenAdmin));
    const { total, pendentes, ativos, encerrados } = res.body;
    expect(pendentes + ativos + encerrados).toBe(total);
  });

  it('total é maior que zero após criação dos atendimentos', async () => {
    const res = await request(app)
      .get('/api/atendimento/stats/dashboard')
      .set(authHeaders(tokenAdmin));
    expect(res.body.total).toBeGreaterThan(0);
  });
});
