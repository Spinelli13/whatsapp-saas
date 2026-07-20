const { Router } = require('express');
const authRoutes = require('./auth');
const whatsappRoutes = require('./whatsapp');
const filaRoutes = require('./fila');
const rolesRoutes = require('./roles');
const planosRoutes = require('./planos');
const usuariosRoutes = require('./usuarios');
const lgpdRoutes = require('./lgpd');
const vendasRoutes = require('./vendas');
const tarefasRoutes = require('./tarefas');
const comunicacaoRoutes = require('./comunicacao');

const router = Router();

router.get('/status', (req, res) => {
  res.json({ api: 'WhatsApp SaaS', version: '1.0.0', status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/fila', filaRoutes);
router.use('/roles', rolesRoutes);
router.use('/planos', planosRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/vendas', vendasRoutes);
router.use('/tarefas', tarefasRoutes);
router.use('/comunicacao', comunicacaoRoutes);
router.use('/', lgpdRoutes);

module.exports = router;
