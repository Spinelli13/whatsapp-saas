'use strict';

// Sentry is initialized in server.js with Sentry.init().
// This module wires up the Express request/error handlers.
const Sentry = require('@sentry/node');

function addRequestHandlers(app) {
  if (!process.env.SENTRY_DSN) return app;
  app.use(Sentry.Handlers.requestHandler());
  // tracingHandler must come before routes for performance monitoring
  if (Sentry.Handlers.tracingHandler) {
    app.use(Sentry.Handlers.tracingHandler());
  }
  return app;
}

function addErrorHandler(app) {
  if (!process.env.SENTRY_DSN) return app;
  // Must be registered AFTER all routes and before generic error handler
  app.use(Sentry.Handlers.errorHandler());
  return app;
}

module.exports = { addRequestHandlers, addErrorHandler };
