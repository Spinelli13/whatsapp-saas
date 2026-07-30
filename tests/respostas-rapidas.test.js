'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { sequelize } = require('../src/backend/models');
const { loginUser } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

const FAKE_ID = '00000000-0000-4000-8000-000000000099';

let tokenAdmin, tokenAtendente;
let respostaId;

beforeAll(async () => {
  await sequelize.query(`DELETE FROM respostas_rapidas WHERE titulo LIKE 'TESTE_%'`);
  [tokenAdmin, tokenAtendente] = await Promise.all([
    loginUser(CREDENTIALS.ADMIN_C1.email,     CREDENTIALS.ADMIN_C1.senha),
    loginUser(CREDENTIALS.ATENDENTE_C1.email, CREDENTIALS.ATENDENTE_C1.senha),
  ]);
});

afterAll(async () => {
  await sequelize.query(`DELETE FROM respostas_rapidas WHERE titulo LIKE 'TESTE_%'`);
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('Auth — Respostas Rápidas requerem autenticação', () => {
  it('GET /api/respostas-rapidas retorna 401 sem token', async () => {
    const res = await request(app).get('/api/respostas-rapidas');
    expect(res.status).toBe(401);
  });

  it('POST /api/respostas-rapidas retorna 401 sem token', async () => {
    const res = await request(app).post('/api/respostas-rapidas').send({ titulo: 'x', conteudo: 'y' });
    expect(res.status).toBe(401);
  });
});

// ── CRUD básico ───────────────────────────────────────────────────────────────

describe('CRUD — Respostas Rápidas', () => {
  it('POST /api/respostas-rapidas cria uma nova resposta', async () => {
    const res = await request(app)
      .post('/api/respostas-rapidas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ titulo: 'TESTE_Olá', conteudo: 'Olá {{nome}}!', atalho: '/teste-ola' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.titulo).toBe('TESTE_Olá');
    expect(res.body.data.atalho).toBe('/teste-ola');
    respostaId = res.body.data.id;
  });

  it('GET /api/respostas-rapidas lista respostas do cliente', async () => {
    const res = await request(app)
      .get('/api/respostas-rapidas')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const encontrada = res.body.data.find((r) => r.id === respostaId);
    expect(encontrada).toBeDefined();
  });

  it('GET /api/respostas-rapidas/:id retorna a resposta específica', async () => {
    const res = await request(app)
      .get(`/api/respostas-rapidas/${respostaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(respostaId);
    expect(res.body.data.conteudo).toBe('Olá {{nome}}!');
  });

  it('PUT /api/respostas-rapidas/:id atualiza título e conteúdo', async () => {
    const res = await request(app)
      .put(`/api/respostas-rapidas/${respostaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ titulo: 'TESTE_Olá Atualizado', conteudo: 'Olá {{nome}}, atualizado!' });

    expect(res.status).toBe(200);
    expect(res.body.data.titulo).toBe('TESTE_Olá Atualizado');
    expect(res.body.data.conteudo).toBe('Olá {{nome}}, atualizado!');
  });

  it('DELETE /api/respostas-rapidas/:id remove a resposta', async () => {
    const res = await request(app)
      .delete(`/api/respostas-rapidas/${respostaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
  });

  it('GET /api/respostas-rapidas/:id retorna 404 após deletar', async () => {
    const res = await request(app)
      .get(`/api/respostas-rapidas/${respostaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
  });
});

// ── Validações ────────────────────────────────────────────────────────────────

describe('Validações — Respostas Rápidas', () => {
  it('POST sem título retorna 400', async () => {
    const res = await request(app)
      .post('/api/respostas-rapidas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ conteudo: 'Algum conteúdo' });

    expect(res.status).toBe(400);
  });

  it('POST sem conteúdo retorna 400', async () => {
    const res = await request(app)
      .post('/api/respostas-rapidas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ titulo: 'TESTE_Sem conteúdo' });

    expect(res.status).toBe(400);
  });

  it('GET /api/respostas-rapidas/:id com ID inexistente retorna 404', async () => {
    const res = await request(app)
      .get(`/api/respostas-rapidas/${FAKE_ID}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
  });

  it('atalho duplicado retorna 409', async () => {
    // Cria uma com atalho /teste-dup
    await request(app)
      .post('/api/respostas-rapidas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ titulo: 'TESTE_Dup 1', conteudo: 'Conteúdo dup 1', atalho: '/teste-dup' });

    // Tenta criar outra com mesmo atalho
    const res = await request(app)
      .post('/api/respostas-rapidas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ titulo: 'TESTE_Dup 2', conteudo: 'Conteúdo dup 2', atalho: '/teste-dup' });

    expect(res.status).toBe(409);
  });
});

// ── Acesso de atendente ───────────────────────────────────────────────────────

describe('Acesso — Atendente pode listar (somente leitura)', () => {
  it('atendente pode GET /api/respostas-rapidas', async () => {
    const res = await request(app)
      .get('/api/respostas-rapidas')
      .set('Authorization', `Bearer ${tokenAtendente}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('atendente pode criar uma resposta rápida', async () => {
    const res = await request(app)
      .post('/api/respostas-rapidas')
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({ titulo: 'TESTE_Atendente', conteudo: 'Mensagem do atendente' });

    expect(res.status).toBe(201);
    expect(res.body.data.titulo).toBe('TESTE_Atendente');
  });
});

// ── substituirVariaveis ───────────────────────────────────────────────────────

describe('RespostaRapidaService.substituirVariaveis()', () => {
  const service = require('../src/backend/services/RespostaRapidaService');

  it('substitui {{nome}} corretamente', () => {
    const result = service.substituirVariaveis('Olá {{nome}}!', { nome: 'João' });
    expect(result).toBe('Olá João!');
  });

  it('substitui múltiplas variáveis', () => {
    const result = service.substituirVariaveis(
      'Olá {{nome}}, protocolo {{protocolo}}',
      { nome: 'Maria', protocolo: '12345' }
    );
    expect(result).toBe('Olá Maria, protocolo 12345');
  });

  it('substitui variável que aparece múltiplas vezes', () => {
    const result = service.substituirVariaveis('{{nome}} é {{nome}}', { nome: 'Ana' });
    expect(result).toBe('Ana é Ana');
  });

  it('não altera texto sem variáveis', () => {
    const result = service.substituirVariaveis('Texto fixo sem variáveis', {});
    expect(result).toBe('Texto fixo sem variáveis');
  });

  it('variável não presente no mapa permanece intacta', () => {
    const result = service.substituirVariaveis('Olá {{nome}}!', {});
    expect(result).toBe('Olá {{nome}}!');
  });

  it('variável com valor undefined no mapa vira string vazia', () => {
    const result = service.substituirVariaveis('Olá {{nome}}!', { nome: undefined });
    expect(result).toBe('Olá !');
  });
});
