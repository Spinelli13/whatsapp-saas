'use strict';

const compression = require('compression');
const rateLimit = require('express-rate-limit');

const isTestEnv = process.env.NODE_ENV === 'test';

const noop = (_req, _res, next) => next();

const compressionMiddleware = compression({
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
});

// Global rate limit: 100 req / 15 min per IP
// Desativado em testes para evitar falsos positivos por IPv6 / volume de requests
const limiter = isTestEnv
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { erro: 'Muitas requisições, tente novamente mais tarde' },
      standardHeaders: true,
      legacyHeaders: false,
      validate: { trustProxy: false },
    });

// Per-authenticated-user rate limit: 60 req / min
const userLimiter = isTestEnv
  ? noop
  : rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      keyGenerator: (req) => (req.usuario ? String(req.usuario.id) : req.ip),
      skip: (req) => !req.usuario,
      message: { erro: 'Limite de requisições por usuário atingido' },
      standardHeaders: true,
      legacyHeaders: false,
      // keyGeneratorIpFallback: disabled because authenticated requests use user ID (not IP)
      // and unauthenticated requests are skipped entirely via skip()
      validate: { trustProxy: false, keyGeneratorIpFallback: false },
    });

module.exports = { compressionMiddleware, limiter, userLimiter };
