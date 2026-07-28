'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

// Números únicos para testes de atendimento (5585992*)
const NUM_C1_1  = '5585992010001';
const NUM_C1_2  = '5585992010002';
const NUM_C1_3  = '5585992010003';
const NUM_C2_1  = '5585992020001';
const NUM_MULTI = '5585992030001';

let tokenC1, tokenC2;
let atendimentoIdC1, atendimentoIdC2, atendimentoParaEncerrar;

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  await sequelize.query(`DELETE FROM message_queue WHERE atendimento_id IN (SELECT id FROM atendimentos WHERE numero_whatsapp LIKE '5585992%')`);
  await sequelize.query(`DELETE FROM atendimentos WHERE numero_whatsapp LIKE '5585992%'`);

  [tokenC1, tokenC2] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email, CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ADMIN_C2.email, CREDENTIALS.ADMIN_C2.senha),
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
    const res = await request(app).post('/api/atendimento/receber').send({ numero: NUM_C1_1, mensagem: 'test' });
    expect(res.status).toBe(401);
  });

  it('GET /api/atendimento/stats/dashboard retorna 401 sem token', async () => {
    const res = await request(app).get('/api/atendimento/stats/dashboard');
    expect(res.status).toBe(401);
  });

  it('POST /api/atendimento/chatbot/analisar retorna 401 sem token', async () => {
    const res = await request(app).post('/api/atendimento/chatbot/analisar').send({ mensagem: 'test' });
    expect(res.status).toBe(401);
  });
});

// ── Receber mensagem (cria atendimento) ───────────────────────────────────────

describe('Receber — cria atendimento ao receber mensagem', () => {
  it('POST /api/atendimento/receber retorna 400 sem numero', async () => {
    const res = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenC1))
      .send({ mensagem: 'Olá' });
    expect(res.status).toBe(400);
  });

  it('POST /api/atendimento/receber retorna 400 sem mensagem', async () => {
    const res = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenC1))
      .send({ numero: NUM_C1_1 });
    expect(res.status).toBe(400);
  });

  it('POST /api/atendimento/receber cria atendimento com analise', async () => {
    const res = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenC1))
      .send({ numero: NUM_C1_1, mensagem: 'Preciso de ajuda urgente com problema no sistema' });
    expect(res.status).toBe(201);
    expect(res.body.atendimento).toBeDefined();
    expect(res.body.analise).toBeDefined();
    expect(res.body.atendimento.numero_whatsapp).toBe(NUM_C1_1);
    expect(res.body.atendimento.status).toBe('pendente');
    expect(['positivo', 'neutro', 'negativo']).toContain(res.body.analise.sentimento);
    expect(['alta', 'media', 'baixa']).toContain(res.body.analise.urgencia);
    atendimentoIdC1 = res.body.atendimento.id;
  });

  it('POST /api/atendimento/receber reutiliza atendimento existente do mesmo número', async () => {
    const res = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenC1))
      .send({ numero: NUM_C1_1, mensagem: 'Segunda mensagem' });
    expect(res.status).toBe(201);
    expect(res.body.atendimento.id).toBe(atendimentoIdC1);
  });

  it('POST /api/atendimento/receber para cliente 2 cria atendimento isolado', async () => {
    const res = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenC2))
      .send({ numero: NUM_C2_1, mensagem: 'Olá do cliente 2' });
    expect(res.status).toBe(201);
    expect(res.body.atendimento).toBeDefined();
    atendimentoIdC2 = res.body.atendimento.id;
  });
});

// ── Chatbot ───────────────────────────────────────────────────────────────────

describe('Chatbot — análise de mensagens', () => {
  it('POST /api/atendimento/chatbot/analisar retorna 400 sem mensagem', async () => {
    const res = await request(app)
      .post('/api/atendimento/chatbot/analisar')
      .set(authHeaders(tokenC1))
      .send({});
    expect(res.status).toBe(400);
  });

  it('detecta sentimento negativo em mensagem de reclamação', async () => {
    const res = await request(app)
      .post('/api/atendimento/chatbot/analisar')
      .set(authHeaders(tokenC1))
      .send({ mensagem: 'O serviço está péssimo, muita demora e erro no sistema' });
    expect(res.status).toBe(200);
    expect(res.body.sentimento).toBe('negativo');
  });

  it('detecta sentimento positivo em mensagem de elogio', async () => {
    const res = await request(app)
      .post('/api/atendimento/chatbot/analisar')
      .set(authHeaders(tokenC1))
      .send({ mensagem: 'Ótimo atendimento, obrigado, perfeito!' });
    expect(res.status).toBe(200);
    expect(res.body.sentimento).toBe('positivo');
  });

  it('detecta urgência alta quando mensagem contém "urgente"', async () => {
    const res = await request(app)
      .post('/api/atendimento/chatbot/analisar')
      .set(authHeaders(tokenC1))
      .send({ mensagem: 'É urgente, preciso resolver agora' });
    expect(res.status).toBe(200);
    expect(res.body.urgencia).toBe('alta');
  });

  it('retorna intent, sentimento, urgencia e palavras_chave', async () => {
    const res = await request(app)
      .post('/api/atendimento/chatbot/analisar')
      .set(authHeaders(tokenC1))
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
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/atendimento/status não retorna atendimentos de outro cliente', async () => {
    const res = await request(app)
      .get('/api/atendimento/status')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    const ids = res.body.map((a) => a.id);
    expect(ids).not.toContain(atendimentoIdC2);
  });

  it('GET /api/atendimento/status filtra por status', async () => {
    const res = await request(app)
      .get('/api/atendimento/status?status=pendente')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    res.body.forEach((a) => expect(a.status).toBe('pendente'));
  });
});

// ── Fila ─────────────────────────────────────────────────────────────────────

describe('Fila — lista pendentes', () => {
  it('GET /api/atendimento/fila retorna apenas pendentes do cliente', async () => {
    const res = await request(app)
      .get('/api/atendimento/fila')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((a) => expect(a.status).toBe('pendente'));
  });

  it('Fila do cliente 2 é independente da do cliente 1', async () => {
    const resC1 = await request(app).get('/api/atendimento/fila').set(authHeaders(tokenC1));
    const resC2 = await request(app).get('/api/atendimento/fila').set(authHeaders(tokenC2));
    const idsC1 = resC1.body.map((a) => a.id);
    const idsC2 = resC2.body.map((a) => a.id);
    expect(idsC1.some((id) => idsC2.includes(id))).toBe(false);
  });
});

// ── Pegar atendimento ─────────────────────────────────────────────────────────

describe('Pegar — atendente assume atendimento', () => {
  it('POST /:id/pegar retorna 404 para atendimento de outro cliente', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC2}/pegar`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(404);
  });

  it('POST /:id/pegar altera status para ativo', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC1}/pegar`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ativo');
    expect(res.body.usuario_id).toBeDefined();
  });

  it('POST /:id/pegar retorna 404 para atendimento já ativo', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC1}/pegar`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(404);
  });
});

// ── Enviar mensagem ───────────────────────────────────────────────────────────

describe('Mensagem — envio de mensagens', () => {
  it('POST /:id/mensagem retorna 400 sem body mensagem', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC1}/mensagem`)
      .set(authHeaders(tokenC1))
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /:id/mensagem retorna 404 para atendimento de outro cliente', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC2}/mensagem`)
      .set(authHeaders(tokenC1))
      .send({ mensagem: 'test' });
    expect(res.status).toBe(404);
  });

  it('POST /:id/mensagem registra mensagem de saída', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC1}/mensagem`)
      .set(authHeaders(tokenC1))
      .send({ mensagem: 'Olá! Como posso ajudar?' });
    expect(res.status).toBe(201);
    expect(res.body.tipo).toBe('saida');
    expect(res.body.mensagem).toBe('Olá! Como posso ajudar?');
    expect(res.body.atendimento_id).toBe(atendimentoIdC1);
  });
});

// ── Marcar dados ──────────────────────────────────────────────────────────────

describe('Dados — marcar dados do cliente', () => {
  it('POST /:id/dados retorna 404 para outro cliente', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC2}/dados`)
      .set(authHeaders(tokenC1))
      .send({ nome: 'Test' });
    expect(res.status).toBe(404);
  });

  it('POST /:id/dados mescla dados no atendimento', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC1}/dados`)
      .set(authHeaders(tokenC1))
      .send({ nome: 'João Teste', empresa: 'ACME', interesse: 'Produto X' });
    expect(res.status).toBe(200);
    expect(res.body.dados_cliente).toBeDefined();
    expect(res.body.dados_cliente.nome).toBe('João Teste');
    expect(res.body.dados_cliente.empresa).toBe('ACME');
  });

  it('POST /:id/dados merge incremental — não sobrescreve campos anteriores', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC1}/dados`)
      .set(authHeaders(tokenC1))
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
    // Cria estágio de pipeline para o cliente 1 para o teste funcionar
    const res = await request(app)
      .post('/api/vendas/pipeline/estagios')
      .set(authHeaders(tokenC1))
      .send({ nome: 'NOVO', cor: '#06b6d4', ordem: 1 });
    estagioId = res.body?.id;
  });

  afterAll(async () => {
    if (estagioId) {
      await sequelize.query(`DELETE FROM historico_oportunidade WHERE oportunidade_id IN (SELECT id FROM oportunidades WHERE estagio_id = '${estagioId}')`);
      await sequelize.query(`DELETE FROM oportunidades WHERE estagio_id = '${estagioId}'`);
      await sequelize.query(`DELETE FROM estagios_pipeline WHERE id = '${estagioId}'`);
    }
  });

  it('POST /:id/encaminhar retorna 404 para outro cliente', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC2}/encaminhar`)
      .set(authHeaders(tokenC1))
      .send({});
    expect(res.status).toBe(404);
  });

  it('POST /:id/encaminhar cria Oportunidade com titulo padrão', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC1}/encaminhar`)
      .set(authHeaders(tokenC1))
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.titulo).toContain(NUM_C1_1);
    expect(res.body.status).toBe('aberta');
  });

  it('POST /:id/encaminhar aceita titulo e valor customizados', async () => {
    // Cria novo atendimento para novo encaminhamento
    const recRes = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenC1))
      .send({ numero: NUM_C1_2, mensagem: 'Quero comprar' });
    const novoId = recRes.body.atendimento.id;

    const res = await request(app)
      .post(`/api/atendimento/${novoId}/encaminhar`)
      .set(authHeaders(tokenC1))
      .send({ titulo: 'Venda especial', valor: 15000 });
    expect(res.status).toBe(201);
    expect(res.body.titulo).toBe('Venda especial');
    expect(parseFloat(res.body.valor)).toBe(15000);
  });
});

// ── Encerrar ──────────────────────────────────────────────────────────────────

describe('Encerrar — finaliza atendimento', () => {
  beforeAll(async () => {
    // Cria atendimento para encerrar
    const res = await request(app)
      .post('/api/atendimento/receber')
      .set(authHeaders(tokenC1))
      .send({ numero: NUM_C1_3, mensagem: 'Atendimento para encerrar' });
    atendimentoParaEncerrar = res.body.atendimento.id;
  });

  it('POST /:id/encerrar retorna 404 para outro cliente', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC2}/encerrar`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(404);
  });

  it('POST /:id/encerrar altera status para encerrado', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoParaEncerrar}/encerrar`)
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('encerrado');
  });
});

// ── Feedback ──────────────────────────────────────────────────────────────────

describe('Feedback — avaliação do atendimento', () => {
  it('POST /:id/feedback retorna 400 para score inválido (6)', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoParaEncerrar}/feedback`)
      .set(authHeaders(tokenC1))
      .send({ score: 6 });
    expect(res.status).toBe(400);
  });

  it('POST /:id/feedback retorna 400 para score inválido (0)', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoParaEncerrar}/feedback`)
      .set(authHeaders(tokenC1))
      .send({ score: 0 });
    expect(res.status).toBe(400);
  });

  it('POST /:id/feedback registra nota 5', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoParaEncerrar}/feedback`)
      .set(authHeaders(tokenC1))
      .send({ score: 5 });
    expect(res.status).toBe(200);
    expect(res.body.feedback_score).toBe(5);
  });

  it('POST /:id/feedback retorna 404 para outro cliente', async () => {
    const res = await request(app)
      .post(`/api/atendimento/${atendimentoIdC2}/feedback`)
      .set(authHeaders(tokenC1))
      .send({ score: 3 });
    expect(res.status).toBe(404);
  });
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

describe('Dashboard — métricas de atendimento', () => {
  it('GET /stats/dashboard retorna estrutura correta', async () => {
    const res = await request(app)
      .get('/api/atendimento/stats/dashboard')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('pendentes');
    expect(res.body).toHaveProperty('ativos');
    expect(res.body).toHaveProperty('encerrados');
    expect(res.body).toHaveProperty('satisfacao_media');
  });

  it('Dashboard do C1 não vazam dados do C2', async () => {
    const resC1 = await request(app).get('/api/atendimento/stats/dashboard').set(authHeaders(tokenC1));
    const resC2 = await request(app).get('/api/atendimento/stats/dashboard').set(authHeaders(tokenC2));
    // Totais devem ser diferentes (isolamento multi-tenant)
    expect(resC1.body.total).not.toEqual(0);
    expect(resC2.body.total).not.toEqual(resC1.body.total);
  });

  it('satisfacao_media reflete feedback registrado', async () => {
    const res = await request(app)
      .get('/api/atendimento/stats/dashboard')
      .set(authHeaders(tokenC1));
    expect(res.status).toBe(200);
    // Registramos feedback_score: 5 no describe anterior
    expect(res.body.satisfacao_media).not.toBeNull();
    expect(Number(res.body.satisfacao_media)).toBeGreaterThanOrEqual(1);
    expect(Number(res.body.satisfacao_media)).toBeLessThanOrEqual(5);
  });

  it('contadores somam corretamente total = pendentes + ativos + encerrados', async () => {
    const res = await request(app)
      .get('/api/atendimento/stats/dashboard')
      .set(authHeaders(tokenC1));
    const { total, pendentes, ativos, encerrados } = res.body;
    expect(pendentes + ativos + encerrados).toBe(total);
  });
});
