const { Router } = require('express');
const { register, login, loginMock, getMockToken } = require('../services/authService');
const { verificarJWT } = require('../middleware/auth');

const router = Router();

// ── Rotas de produção (manter para sempre) ───────────────────

router.post('/register', async (req, res, next) => {
  try {
    const { nome, email, senha, cliente_id, role } = req.body;

    if (!nome || !email || !senha || !cliente_id) {
      return res.status(400).json({ error: 'nome, email, senha e cliente_id são obrigatórios' });
    }

    const usuario = await register({ nome, email, senha, cliente_id, role });
    return res.status(201).json({ mensagem: 'Usuário criado com sucesso', usuario });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'email e senha são obrigatórios' });
    }

    const resultado = await login({ email, senha });
    return res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.get('/verify', verificarJWT, (req, res) => {
  res.json({ valido: true, usuario: req.usuario });
});

// ─────────────────────────────────────────────────────────────
// MOCK - REMOVER EM 2.3
// TODO: Quando PostgreSQL estiver pronto (FASE 2.3):
//   1. Deletar as duas rotas abaixo (/login-mock e /mock-token)
//   2. Ver docs/MOCK-AUTH-TEMPORARIO.md para checklist completo
// ─────────────────────────────────────────────────────────────

// POST /auth/login-mock — login com email+senha do usuário fictício
router.post('/login-mock', async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'email e senha são obrigatórios' });
    }

    const resultado = await loginMock({ email, senha });
    return res.json(resultado);
  } catch (err) {
    next(err);
  }
});

// GET /auth/mock-token?cliente_id=1 — token sem senha (para curl/browser)
// Exemplo: curl http://localhost:3000/api/auth/mock-token?cliente_id=1
// cliente_id=1 → admin@cliente1.com | cliente_id=2 → admin@barcos.com
router.get('/mock-token', (req, res, next) => {
  try {
    const clienteId = parseInt(req.query.cliente_id || '1', 10);
    const resultado = getMockToken(clienteId);
    return res.json(resultado);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// FIM MOCK
// ─────────────────────────────────────────────────────────────

module.exports = router;
