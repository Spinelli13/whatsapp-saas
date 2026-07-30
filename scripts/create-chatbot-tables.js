'use strict';

require('dotenv').config();
const { sequelize } = require('../src/backend/models');

(async () => {
  try {
    await sequelize.authenticate();

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS fluxos_bot (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        estrutura_json JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
        mensagem_saudacao TEXT,
        mensagem_despedida TEXT,
        ativo BOOLEAN NOT NULL DEFAULT false,
        criado_em TIMESTAMPTZ DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_fluxos_bot_cliente_id ON fluxos_bot (cliente_id)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_fluxos_bot_ativo ON fluxos_bot (ativo)
    `);

    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_respostas_automaticas_tipo') THEN
          CREATE TYPE "enum_respostas_automaticas_tipo" AS ENUM ('exato', 'contem', 'regex');
        END IF;
      END $$;
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS respostas_automaticas (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
        palavra_chave VARCHAR(100) NOT NULL,
        resposta TEXT NOT NULL,
        tipo "enum_respostas_automaticas_tipo" NOT NULL DEFAULT 'exato',
        ativo BOOLEAN NOT NULL DEFAULT true,
        criado_em TIMESTAMPTZ DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_respostas_automaticas_cliente_id ON respostas_automaticas (cliente_id)
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_respostas_automaticas_palavra_chave ON respostas_automaticas (palavra_chave)
    `);

    console.log('Tabelas fluxos_bot e respostas_automaticas criadas com sucesso');
    await sequelize.close();
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
