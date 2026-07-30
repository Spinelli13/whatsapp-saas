require('dotenv').config();

// Constrói DATABASE_URL a partir de vars individuais como fallback
// Suporta tanto POSTGRES_* (padrão Docker/GitHub Actions) quanto DB_* (legado)
const _buildUrl = () => {
  const u = process.env.POSTGRES_USER     || process.env.DB_USER     || 'postgres';
  const p = process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS || 'postgres';
  const h = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 5432;
  const db = process.env.POSTGRES_DB || process.env.DB_NAME || 'whatsapp_saas';
  return `postgresql://${u}:${p}@${h}:${port}/${db}`;
};

const dbUrl = process.env.DATABASE_URL || _buildUrl();

// Configuração para sequelize-cli (db:migrate, db:seed, etc.)
module.exports = {
  development: {
    url: dbUrl,
    dialect: 'postgres',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    dialectOptions: {},
  },
  test: {
    url: dbUrl,
    dialect: 'postgres',
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  },
};
