const path = require('path');

module.exports = {
  SESSION_DIR: path.resolve(process.cwd(), 'whatsapp-sessions'),

  // Tempo máximo aguardando QR ser escaneado (ms)
  QR_TIMEOUT_MS: 60_000,

  // Reconectar automaticamente após queda
  RECONNECT_ON_CLOSE: true,

  // Máximo de reconexões antes de desistir
  MAX_RECONNECT_ATTEMPTS: 5,

  // Ignorar mensagens de grupos (apenas DM por enquanto)
  IGNORE_GROUPS: true,

  // Ignorar mensagens enviadas pelo próprio bot
  IGNORE_OWN_MESSAGES: true,
};
