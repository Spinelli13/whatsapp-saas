'use strict';

const { Router } = require('express');
// sequelize instance lives in models/index.js, not config/database (which exports config objects)
const { sequelize } = require('../models');
const redisClient = require('../config/redis');

const router = Router();

router.get('/health', async (req, res) => {
  const checks = {
    database: 'unknown',
    redis: 'unknown',
    server: 'ok',
  };

  // Database check
  try {
    await sequelize.authenticate();
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Redis check — promise-based (v4) or in-memory fallback
  try {
    if (redisClient._isInMemory) {
      checks.redis = 'ok (in-memory)';
    } else {
      await redisClient.ping();
      checks.redis = 'ok';
    }
  } catch {
    checks.redis = 'error';
  }

  const allOk = checks.database !== 'error' && checks.redis !== 'error';

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    services: checks,
  });
});

router.get('/health/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ready', ready: true, database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', ready: false, database: 'disconnected', error: err.message });
  }
});

router.get('/health/live', (req, res) => {
  res.json({ alive: true, timestamp: new Date().toISOString() });
});

module.exports = router;
