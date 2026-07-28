'use strict';

// In-memory fallback used when Redis is not available (tests, dev without Redis)
const inMemoryCache = new Map();
const inMemoryTTLs = new Map();

const inMemory = {
  _isInMemory: true,
  async get(key) {
    const ttl = inMemoryTTLs.get(key);
    if (ttl && Date.now() > ttl) {
      inMemoryCache.delete(key);
      inMemoryTTLs.delete(key);
      return null;
    }
    return inMemoryCache.get(key) ?? null;
  },
  async setEx(key, seconds, value) {
    inMemoryCache.set(key, value);
    inMemoryTTLs.set(key, Date.now() + seconds * 1000);
  },
  async del(...args) {
    const keys = args.flat();
    keys.forEach((k) => {
      inMemoryCache.delete(k);
      inMemoryTTLs.delete(k);
    });
    return keys.length;
  },
  async keys(pattern) {
    const regex = new RegExp(
      '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
    );
    return [...inMemoryCache.keys()].filter((k) => regex.test(k));
  },
};

let redisClient = inMemory;

// Only attempt Redis connection when REDIS_HOST is explicitly configured
if (process.env.REDIS_HOST) {
  try {
    const { createClient } = require('redis');
    const client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        reconnectStrategy: (attempts) => {
          if (attempts > 3) return false;
          return Math.min(attempts * 100, 1000);
        },
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB || '0', 10),
    });

    client.on('error', (err) => console.warn('Redis error:', err.message));
    client.on('connect', () => console.log('Redis connected'));

    client
      .connect()
      .then(() => {
        redisClient = client;
      })
      .catch(() => {
        console.warn('Redis connection failed, using in-memory fallback');
      });
  } catch (err) {
    console.warn('Redis module error, using in-memory fallback');
  }
}

module.exports = redisClient;
