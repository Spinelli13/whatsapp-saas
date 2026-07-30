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
const automacoesRoutes = require('./automacoes');
const analyticsRoutes = require('./analytics');
const atendimentoRoutes = require('./atendimento');
const respostasRapidasRoutes = require('./respostasRapidas');
const statusRoutes = require('./status');
const chatbotRoutes = require('./chatbot');
const roteamentoRoutes = require('./roteamento');
const relatorioRoutes = require('./relatorio');
const transferenciaRoutes = require('./transferencia');

const router = Router();

router.get('/status', (req, res) => {
  res.json({ api: 'SI-CRM', version: '1.0.0', status: 'ok' });
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
router.use('/automacoes', automacoesRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/atendimento', atendimentoRoutes);
router.use('/respostas-rapidas', respostasRapidasRoutes);
router.use('/atendente', statusRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/roteamento', roteamentoRoutes);
router.use('/relatorio', relatorioRoutes);
router.use('/transferencia', transferenciaRoutes);
router.use('/', lgpdRoutes);

module.exports = router;
