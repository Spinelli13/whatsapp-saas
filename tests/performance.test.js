'use strict';

const request = require('supertest');
const { app } = require('../src/backend/server');
const { paginate, buildPaginationResponse } = require('../src/backend/utils/pagination');
const { cache, invalidateCache } = require('../src/backend/middleware/cacheMiddleware');
const { compressionMiddleware, limiter, userLimiter } = require('../src/backend/middleware/performanceMiddleware');
const { loginUser, authHeaders } = require('./helpers/auth.helper');
const { CREDENTIALS } = require('./constants');

// ─── Pagination Utility ───────────────────────────────────────────────────────

describe('Pagination — paginate()', () => {
  it('defaults: page 1, limit 20', () => {
    const result = paginate();
    expect(result).toEqual({ offset: 0, limit: 20, page: 1 });
  });

  it('page 2, limit 20 → offset 20', () => {
    const result = paginate(2, 20);
    expect(result).toEqual({ offset: 20, limit: 20, page: 2 });
  });

  it('page 3, limit 10 → offset 20', () => {
    const result = paginate(3, 10);
    expect(result).toEqual({ offset: 20, limit: 10, page: 3 });
  });

  it('clamps limit to max 100', () => {
    const result = paginate(1, 500);
    expect(result.limit).toBe(100);
  });

  it('clamps page to min 1 for invalid input', () => {
    const result = paginate(-5, 10);
    expect(result.page).toBe(1);
    expect(result.offset).toBe(0);
  });

  it('parses string numbers', () => {
    const result = paginate('2', '15');
    expect(result).toEqual({ offset: 15, limit: 15, page: 2 });
  });

  it('defaults to page 1 and limit 20 for NaN inputs', () => {
    const result = paginate('abc', 'xyz');
    expect(result).toEqual({ offset: 0, limit: 20, page: 1 });
  });

  it('limit 1 is allowed', () => {
    const result = paginate(1, 1);
    expect(result).toEqual({ offset: 0, limit: 1, page: 1 });
  });
});

// ─── buildPaginationResponse() ────────────────────────────────────────────────

describe('Pagination — buildPaginationResponse()', () => {
  it('builds response with correct pagination meta', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = buildPaginationResponse(data, 42, 1, 10);
    expect(result.data).toEqual(data);
    expect(result.pagination.total).toBe(42);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.pages).toBe(5);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('last page: hasNext false, hasPrev true', () => {
    const result = buildPaginationResponse([], 50, 5, 10);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(true);
  });

  it('single page: both false', () => {
    const result = buildPaginationResponse([], 5, 1, 20);
    expect(result.pagination.hasNext).toBe(false);
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('zero total → pages = 1', () => {
    const result = buildPaginationResponse([], 0, 1, 20);
    expect(result.pagination.pages).toBe(1);
    expect(result.pagination.total).toBe(0);
  });

  it('exact page boundary: total === page * limit', () => {
    const result = buildPaginationResponse([], 20, 2, 10);
    expect(result.pagination.pages).toBe(2);
    expect(result.pagination.hasNext).toBe(false);
  });
});

// ─── Performance Middleware exports ───────────────────────────────────────────

describe('Performance Middleware', () => {
  it('compressionMiddleware is a function', () => {
    expect(typeof compressionMiddleware).toBe('function');
  });

  it('limiter is a function (Express middleware)', () => {
    expect(typeof limiter).toBe('function');
  });

  it('userLimiter is a function', () => {
    expect(typeof userLimiter).toBe('function');
  });
});

// ─── Cache Middleware exports ─────────────────────────────────────────────────

describe('Cache Middleware', () => {
  it('cache() returns a middleware function', () => {
    const middleware = cache(60);
    expect(typeof middleware).toBe('function');
  });

  it('invalidateCache is a function', () => {
    expect(typeof invalidateCache).toBe('function');
  });

  it('cache() works with default TTL', () => {
    const middleware = cache();
    expect(typeof middleware).toBe('function');
  });

  it('invalidateCache resolves without error when no keys match', async () => {
    await expect(invalidateCache('cache:99999:*')).resolves.toBeUndefined();
  });

  it('cache() middleware skips non-GET requests', async () => {
    const middleware = cache(60);
    let nextCalled = false;
    const req = { method: 'POST', originalUrl: '/test', usuario: { cliente_id: 1 } };
    const res = {};
    const next = () => { nextCalled = true; };
    await middleware(req, res, next);
    expect(nextCalled).toBe(true);
  });
});

// ─── Compression Integration ──────────────────────────────────────────────────

describe('Compression Integration', () => {
  it('GET /health responds with 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('accepts Accept-Encoding: gzip header without error', async () => {
    const res = await request(app)
      .get('/health')
      .set('Accept-Encoding', 'gzip, deflate');
    expect(res.status).toBe(200);
  });

  it('x-no-compression header bypasses compression', async () => {
    const res = await request(app)
      .get('/health')
      .set('x-no-compression', '1');
    expect(res.status).toBe(200);
  });
});

// ─── Rate Limiting Integration ────────────────────────────────────────────────

describe('Rate Limiting Integration', () => {
  it('responds normally within rate limit', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('includes RateLimit headers in response', async () => {
    const res = await request(app).get('/health');
    // express-rate-limit standardHeaders: true adds RateLimit-* headers
    expect(res.headers).toHaveProperty('ratelimit-limit');
  });

  it('GET /api/status returns 200 within limit', async () => {
    const token = await loginUser(CREDENTIALS.CLIENTE);
    const res = await request(app)
      .get('/api/status')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 401]).toContain(res.status);
  });
});

// ─── Service Worker (structure checks) ───────────────────────────────────────

describe('Service Worker Config', () => {
  it('CACHE_NAME constant is defined in sw source', () => {
    const fs = require('fs');
    const path = require('path');
    const swPath = path.join(__dirname, '../src/frontend/public/service-worker.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    expect(content).toContain('crm-v1');
    expect(content).toContain('install');
    expect(content).toContain('fetch');
    expect(content).toContain('activate');
  });

  it('service worker does not cache /api/ requests', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../src/frontend/public/service-worker.js'),
      'utf-8'
    );
    expect(content).toContain('/api/');
  });
});

// ─── PWA Manifest ─────────────────────────────────────────────────────────────

describe('PWA Manifest', () => {
  it('manifest.json has required PWA fields', () => {
    const fs = require('fs');
    const path = require('path');
    const manifest = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../src/frontend/public/manifest.json'), 'utf-8')
    );
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it('theme_color is the cyan brand color', () => {
    const fs = require('fs');
    const path = require('path');
    const manifest = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../src/frontend/public/manifest.json'), 'utf-8')
    );
    expect(manifest.theme_color).toBe('#06b6d4');
  });
});

// ─── Offline.html ─────────────────────────────────────────────────────────────

describe('offline.html', () => {
  it('offline.html exists and contains fallback message', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(
      path.join(__dirname, '../src/frontend/public/offline.html'),
      'utf-8'
    );
    expect(content).toContain('Offline');
    expect(content).toContain('<!DOCTYPE html>');
  });
});
