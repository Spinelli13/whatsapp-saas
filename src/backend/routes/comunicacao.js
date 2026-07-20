'use strict';

const { Router } = require('express');
const { verificarJWT } = require('../middleware/auth');
const EmailService = require('../services/emailService');
const SMSService = require('../services/smsService');

const router = Router();
router.use(verificarJWT);

// ── Email ──────────────────────────────────────────────────────────────────

router.get('/emails', async (req, res, next) => {
  try {
    res.json(await EmailService.listar(req.usuario.cliente_id, req.query));
  } catch (err) { next(err); }
});

router.post('/emails', async (req, res, next) => {
  try {
    const { destinatario_email, assunto } = req.body;
    if (!destinatario_email) return res.status(400).json({ error: 'destinatario_email obrigatório' });
    if (!assunto) return res.status(400).json({ error: 'assunto obrigatório' });
    const email = await EmailService.enviar(req.usuario.cliente_id, req.body, req.usuario.id);
    res.status(201).json(email);
  } catch (err) { next(err); }
});

router.get('/emails/:id', async (req, res, next) => {
  try {
    const email = await EmailService.obter(req.params.id, req.usuario.cliente_id);
    if (!email) return res.status(404).json({ error: 'Email não encontrado' });
    res.json(email);
  } catch (err) { next(err); }
});

router.delete('/emails/:id', async (req, res, next) => {
  try {
    const deleted = await EmailService.deletar(req.params.id, req.usuario.cliente_id);
    if (!deleted) return res.status(404).json({ error: 'Email não encontrado' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── SMS ────────────────────────────────────────────────────────────────────

router.get('/sms', async (req, res, next) => {
  try {
    res.json(await SMSService.listar(req.usuario.cliente_id, req.query));
  } catch (err) { next(err); }
});

router.post('/sms', async (req, res, next) => {
  try {
    const { numero_destino, mensagem } = req.body;
    if (!numero_destino) return res.status(400).json({ error: 'numero_destino obrigatório' });
    if (!mensagem) return res.status(400).json({ error: 'mensagem obrigatória' });
    const sms = await SMSService.enviar(req.usuario.cliente_id, req.body, req.usuario.id);
    res.status(201).json(sms);
  } catch (err) { next(err); }
});

router.get('/sms/:id', async (req, res, next) => {
  try {
    const sms = await SMSService.obter(req.params.id, req.usuario.cliente_id);
    if (!sms) return res.status(404).json({ error: 'SMS não encontrado' });
    res.json(sms);
  } catch (err) { next(err); }
});

router.delete('/sms/:id', async (req, res, next) => {
  try {
    const deleted = await SMSService.deletar(req.params.id, req.usuario.cliente_id);
    if (!deleted) return res.status(404).json({ error: 'SMS não encontrado' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
