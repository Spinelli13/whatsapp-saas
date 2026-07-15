module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_troque_em_producao',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_troque_em_producao',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'dev_encryption_key_32chars_padded',

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'whatsapp_saas',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_SSL: process.env.DB_SSL === 'true',
};
