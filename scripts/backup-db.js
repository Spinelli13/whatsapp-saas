#!/usr/bin/env node
'use strict';

// Database backup script — requires pg_dump (PostgreSQL client tools)
// Usage: node scripts/backup-db.js
// Cron (daily at 2am): 0 2 * * * cd /app && node scripts/backup-db.js

require('dotenv').config({ path: '.env.production.local' });

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

function formatTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function backupDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não definida');
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = formatTimestamp();
  const backupFile = path.join(BACKUP_DIR, `crm_backup_${timestamp}.sql`);

  console.log(`🔄 Iniciando backup → ${backupFile}`);

  const command = `pg_dump "${databaseUrl}" -F plain -f "${backupFile}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Erro no backup:', error.message);
      process.exit(1);
    }
    if (stderr) console.warn('pg_dump warn:', stderr);

    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`✅ Backup concluído: ${backupFile} (${sizeMB} MB)`);

    // Remove backups older than 30 days
    pruneOldBackups();
  });
}

function pruneOldBackups() {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.sql'));

  let removed = 0;
  files.forEach((file) => {
    const filePath = path.join(BACKUP_DIR, file);
    const { mtimeMs } = fs.statSync(filePath);
    if (mtimeMs < thirtyDaysAgo) {
      fs.unlinkSync(filePath);
      removed++;
    }
  });

  if (removed > 0) console.log(`🗑️  ${removed} backup(s) antigos removidos`);
}

backupDatabase();
