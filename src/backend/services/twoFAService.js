'use strict';

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const EncryptionService = require('./encryptionService');
const { Usuario2FA, DispositivoUsuario, SessaoUsuario } = require('../models');

// In-memory SMS code cache (production: use Redis)
// Key: `${usuario_id}`, Value: { code, expires }
const smsCache = new Map();

const TwoFAService = {
  // ── TOTP ──────────────────────────────────────────────────────────────────

  async setupTOTP(usuario_id) {
    const secretObj = speakeasy.generateSecret({
      length: 20,
      name: `WhatsApp SaaS (${usuario_id})`,
      issuer: 'WhatsApp SaaS CRM',
    });

    const qrCode = await QRCode.toDataURL(secretObj.otpauth_url);
    const backupCodes = EncryptionService.generateBackupCodes(10);

    return { secret: secretObj.base32, qrCode, backupCodes };
  },

  async confirmTOTP(usuario_id, secret, token) {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: String(token),
      window: 2,
    });

    if (!verified) throw new Error('Token inválido');

    const encryptedSecret = EncryptionService.encrypt(secret);
    const backupCodes = EncryptionService.generateBackupCodes(10);
    const encryptedBackups = EncryptionService.encrypt(backupCodes);

    const [registro, created] = await Usuario2FA.findOrCreate({
      where: { usuario_id },
      defaults: { usuario_id, tipo: 'totp', totp_secret: encryptedSecret, backup_codes: encryptedBackups, ativado: true },
    });

    if (!created) {
      await registro.update({ tipo: 'totp', totp_secret: encryptedSecret, backup_codes: encryptedBackups, ativado: true });
    }

    return { success: true, backupCodes };
  },

  async verifyTOTP(usuario_id, token) {
    const registro = await Usuario2FA.findOne({ where: { usuario_id, ativado: true, tipo: 'totp' } });
    if (!registro) throw new Error('TOTP não configurado');

    const secret = EncryptionService.decrypt(registro.totp_secret);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: String(token),
      window: 2,
    });

    if (!verified) throw new Error('Token inválido');
    return true;
  },

  // ── SMS ───────────────────────────────────────────────────────────────────

  async setupSMS(usuario_id, telefone) {
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + 5 * 60 * 1000; // 5 min

    smsCache.set(String(usuario_id), { codigo, expires });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MOCK SMS] Código 2FA para ${telefone}: ${codigo}`);
    }

    return { enviado: true, codigoParaTestesAPENAS: process.env.NODE_ENV !== 'production' ? codigo : undefined };
  },

  async confirmSMS(usuario_id, telefone, codigo) {
    const cached = smsCache.get(String(usuario_id));
    if (!cached || cached.codigo !== String(codigo) || Date.now() > cached.expires) {
      throw new Error('Código inválido ou expirado');
    }

    smsCache.delete(String(usuario_id));

    const encryptedBackups = EncryptionService.encrypt(EncryptionService.generateBackupCodes(10));

    const [registro, created] = await Usuario2FA.findOrCreate({
      where: { usuario_id },
      defaults: { usuario_id, tipo: 'sms', telefone_2fa: telefone, backup_codes: encryptedBackups, ativado: true },
    });

    if (!created) {
      await registro.update({ tipo: 'sms', telefone_2fa: telefone, backup_codes: encryptedBackups, ativado: true });
    }

    return { success: true };
  },

  async verifySMS(usuario_id, codigo) {
    const cached = smsCache.get(String(usuario_id));
    if (!cached || cached.codigo !== String(codigo) || Date.now() > cached.expires) {
      throw new Error('Código inválido ou expirado');
    }
    smsCache.delete(String(usuario_id));
    return true;
  },

  // ── Devices ───────────────────────────────────────────────────────────────

  async listarDispositivos(usuario_id) {
    return DispositivoUsuario.findAll({
      where: { usuario_id },
      order: [['ultimo_acesso', 'DESC']],
    });
  },

  async confiarDispositivo(usuario_id, dispositivo_id) {
    const dispositivo = await DispositivoUsuario.findOne({ where: { id: dispositivo_id, usuario_id } });
    if (!dispositivo) throw new Error('Dispositivo não encontrado');
    await dispositivo.update({ trusted: true });
    return dispositivo;
  },

  async revogarDispositivo(usuario_id, dispositivo_id) {
    const dispositivo = await DispositivoUsuario.findOne({ where: { id: dispositivo_id, usuario_id } });
    if (!dispositivo) throw new Error('Dispositivo não encontrado');

    await SessaoUsuario.update({ ativa: false }, { where: { dispositivo_id: dispositivo.id } });
    await dispositivo.destroy();
    return true;
  },
};

module.exports = TwoFAService;
