'use strict';

const AuditService = require('../services/auditService');

function auditMiddleware(acao) {
  return async (req, res, next) => {
    const originalSend = res.send.bind(res);

    res.send = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.usuario) {
        const tabela = req.path.split('/').filter(Boolean)[0] || 'desconhecida';

        AuditService.registrarAcao(
          req.usuario.id,
          req.usuario.cliente_id,
          tabela,
          acao,
          req.method !== 'POST' ? req.body || null : null,
          null,
          req
        ).catch(() => {});
      }

      return originalSend(data);
    };

    next();
  };
}

module.exports = auditMiddleware;
