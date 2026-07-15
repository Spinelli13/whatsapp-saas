const { Router } = require('express');
const authRoutes = require('./auth');
const whatsappRoutes = require('./whatsapp');
const filaRoutes = require('./fila');
const rolesRoutes = require('./roles');

const router = Router();

router.get('/status', (req, res) => {
  res.json({ api: 'WhatsApp SaaS', version: '1.0.0', status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/fila', filaRoutes);
router.use('/roles', rolesRoutes);

module.exports = router;
