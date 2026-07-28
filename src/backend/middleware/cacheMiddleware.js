'use strict';

const redisClient = require('../config/redis');

const cache = (ttl = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = `cache:${req.usuario?.cliente_id}:${req.originalUrl}`;

    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.warn('Cache read error:', err.message);
    }

    const originalJson = res.json.bind(res);

    res.json = function (data) {
      redisClient
        .setEx(key, ttl, JSON.stringify(data))
        .catch((err) => console.warn('Cache write error:', err.message));
      return originalJson(data);
    };

    next();
  };
};

const invalidateCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.warn('Cache invalidation error:', err.message);
  }
};

module.exports = { cache, invalidateCache };
