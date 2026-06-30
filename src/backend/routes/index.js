const { Router } = require('express');

const router = Router();

router.get('/status', (req, res) => {
  res.json({ api: 'WhatsApp SaaS', version: '1.0.0', status: 'ok' });
});

module.exports = router;
