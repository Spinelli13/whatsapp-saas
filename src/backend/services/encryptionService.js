'use strict';

const crypto = require('crypto');
const { ENCRYPTION_KEY } = require('../config/environment');

const ALGORITHM = 'aes-256-gcm';

function deriveKey(password) {
  return crypto.createHash('sha256').update(String(password)).digest();
}

const EncryptionService = {
  encrypt(data, password = ENCRYPTION_KEY) {
    const key = deriveKey(password);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  },

  decrypt(encryptedData, password = ENCRYPTION_KEY) {
    const key = deriveKey(password);
    const [ivHex, tagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  },

  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  },
};

module.exports = EncryptionService;
