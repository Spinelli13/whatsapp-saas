'use strict';

const { Router } = require('express');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const { register, login, validarToken, criarSessao, refresharToken, encerrarSessao } = require('../services/authService');
const TwoFAService = require('../services/twoFAService');
const { verificarJWT } = require('../middleware/auth');
const { Usuario2FA } = require('../models');
const { JWT_SECRET, FRONTEND_URL } = require('../config/environment');

const router = Router();

// ── Existing routes (backward compat — do NOT change response shape) ───────

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

// Login: returns { token, usuario } (backward compat).
// If the user has 2FA enabled, ALSO returns { tempToken, tipo2FA } so the
// frontend can redirect to the verification step without breaking old clients.
router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'email e senha são obrigatórios' });
    }

    const resultado = await login({ email, senha });

    const config2fa = await Usuario2FA.findOne({
      where: { usuario_id: resultado.usuario.id, ativado: true },
    });

    if (config2fa) {
      const tempToken = jwt.sign(
        { usuario_id: resultado.usuario.id, tipo: 'verificacao_2fa' },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({ tempToken, tipo2FA: config2fa.tipo });
    }

    return res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.get('/verify', verificarJWT, (req, res) => {
  res.json({ valido: true, usuario: req.usuario });
});

// ── 2FA verification ───────────────────────────────────────────────────────

router.post('/verify-2fa', async (req, res, next) => {
  try {
    const { tempToken, codigo, deviceId } = req.body;
    if (!tempToken || !codigo) {
      return res.status(400).json({ error: 'tempToken e codigo são obrigatórios' });
    }

    let payload;
    try {
      payload = jwt.verify(tempToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'tempToken inválido ou expirado' });
    }

    if (payload.tipo !== 'verificacao_2fa') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const config2fa = await Usuario2FA.findOne({ where: { usuario_id: payload.usuario_id, ativado: true } });
    if (!config2fa) return res.status(400).json({ error: '2FA não configurado' });

    if (config2fa.tipo === 'totp') {
      await TwoFAService.verifyTOTP(payload.usuario_id, codigo);
    } else if (config2fa.tipo === 'sms') {
      await TwoFAService.verifySMS(payload.usuario_id, codigo);
    }

    const tokens = await criarSessao(
      payload.usuario_id,
      deviceId || req.headers['user-agent'] || 'unknown',
      req.headers['user-agent'],
      req.ip
    );

    res.json(tokens);
  } catch (err) {
    if (err.message?.includes('inválid') || err.message?.includes('expirad')) {
      return res.status(401).json({ error: err.message });
    }
    next(err);
  }
});

// ── TOTP setup ─────────────────────────────────────────────────────────────

router.post('/2fa/setup-totp', verificarJWT, async (req, res, next) => {
  try {
    const resultado = await TwoFAService.setupTOTP(req.usuario.id);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.post('/2fa/confirm-totp', verificarJWT, async (req, res, next) => {
  try {
    const { secret, token } = req.body;
    if (!secret || !token) return res.status(400).json({ error: 'secret e token são obrigatórios' });
    const resultado = await TwoFAService.confirmTOTP(req.usuario.id, secret, token);
    res.json(resultado);
  } catch (err) {
    if (err.message === 'Token inválido') return res.status(400).json({ error: err.message });
    next(err);
  }
});

// ── SMS setup ──────────────────────────────────────────────────────────────

router.post('/2fa/setup-sms', verificarJWT, async (req, res, next) => {
  try {
    const { telefone } = req.body;
    if (!telefone) return res.status(400).json({ error: 'telefone é obrigatório' });
    const resultado = await TwoFAService.setupSMS(req.usuario.id, telefone);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.post('/2fa/confirm-sms', verificarJWT, async (req, res, next) => {
  try {
    const { telefone, codigo } = req.body;
    if (!telefone || !codigo) return res.status(400).json({ error: 'telefone e codigo são obrigatórios' });
    await TwoFAService.confirmSMS(req.usuario.id, telefone, codigo);
    res.json({ success: true });
  } catch (err) {
    if (err.message?.includes('inválid') || err.message?.includes('expirad')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ── Session management ─────────────────────────────────────────────────────

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken é obrigatório' });
    const tokens = await refresharToken(refreshToken);
    res.json(tokens);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.post('/logout', verificarJWT, async (req, res, next) => {
  try {
    await encerrarSessao(req.body.refreshToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Device management ──────────────────────────────────────────────────────

router.get('/dispositivos', verificarJWT, async (req, res, next) => {
  try {
    const dispositivos = await TwoFAService.listarDispositivos(req.usuario.id);
    res.json(dispositivos);
  } catch (err) {
    next(err);
  }
});

router.post('/dispositivos/:id/confiar', verificarJWT, async (req, res, next) => {
  try {
    const dispositivo = await TwoFAService.confiarDispositivo(req.usuario.id, req.params.id);
    res.json({ success: true, dispositivo });
  } catch (err) {
    if (err.message === 'Dispositivo não encontrado') return res.status(404).json({ error: err.message });
    next(err);
  }
});

router.delete('/dispositivos/:id', verificarJWT, async (req, res, next) => {
  try {
    await TwoFAService.revogarDispositivo(req.usuario.id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'Dispositivo não encontrado') return res.status(404).json({ error: err.message });
    next(err);
  }
});

// ── Social login (Google) ──────────────────────────────────────────────────

const FRONTEND = FRONTEND_URL || 'http://localhost:5173';

if (process.env.GOOGLE_CLIENT_ID) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND}/login?error=google_failed`, session: false }),
    async (req, res, next) => {
      try {
        const tokens = await criarSessao(req.user.id, 'google-oauth', req.headers['user-agent'], req.ip);
        res.redirect(`${FRONTEND}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
      } catch (err) {
        next(err);
      }
    }
  );
} else {
  router.get('/google', (req, res) => res.status(501).json({ error: 'Google OAuth não configurado' }));
  router.get('/google/callback', (req, res) => res.status(501).json({ error: 'Google OAuth não configurado' }));
}

// ── Social login (Microsoft) ───────────────────────────────────────────────

if (process.env.MICROSOFT_CLIENT_ID) {
  router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));

  router.get('/microsoft/callback',
    passport.authenticate('microsoft', { failureRedirect: `${FRONTEND}/login?error=microsoft_failed`, session: false }),
    async (req, res, next) => {
      try {
        const tokens = await criarSessao(req.user.id, 'microsoft-oauth', req.headers['user-agent'], req.ip);
        res.redirect(`${FRONTEND}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
      } catch (err) {
        next(err);
      }
    }
  );
} else {
  router.get('/microsoft', (req, res) => res.status(501).json({ error: 'Microsoft OAuth não configurado' }));
  router.get('/microsoft/callback', (req, res) => res.status(501).json({ error: 'Microsoft OAuth não configurado' }));
}

module.exports = router;
