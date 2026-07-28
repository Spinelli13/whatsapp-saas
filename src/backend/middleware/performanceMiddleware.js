'use strict';

const compression = require('compression');
const rateLimit = require('express-rate-limit');

const compressionMiddleware = compression({
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
});

// Global rate limit: 100 req / 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { erro: 'Muitas requisições, tente novamente mais tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-authenticated-user rate limit: 60 req / min
const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => (req.usuario ? String(req.usuario.id) : req.ip),
  skip: (req) => !req.usuario,
  message: { erro: 'Limite de requisições por usuário atingido' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { compressionMiddleware, limiter, userLimiter };
