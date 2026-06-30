const { NODE_ENV } = require('../config/environment');

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  if (NODE_ENV !== 'test') {
    console.error(`[${status}] ${message}`, NODE_ENV === 'development' ? err.stack : '');
  }

  res.status(status).json({
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
