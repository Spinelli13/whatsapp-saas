const { Router } = require('express');
const { register, login, loginMock } = require('../services/authService');
const { verificarJWT } = require('../middleware/auth');

const router = Router();

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

// Rota de desenvolvimento — não funciona em produção
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

module.exports = router;
