'use strict';

const request = require('supertest');
const { app } = require('../../src/backend/server');

async function loginUser(email, senha) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, senha });

  if (res.status !== 200) {
    throw new Error(`Login falhou para ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { loginUser, authHeaders };
