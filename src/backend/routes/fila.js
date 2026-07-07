const { Router } = require('express');
const { verificarJWT, autorizarClienteId } = require('../middleware/auth');
const filaService = require('../services/filaService');
const departamentoService = require('../services/departamentoService');

const router = Router();

router.use(verificarJWT);

// GET /api/fila/departamentos/:cliente_id
router.get('/departamentos/:cliente_id', autorizarClienteId, async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.cliente_id, 10);
    const departamentos = await departamentoService.listarDepartamentos(clienteId);
    res.json({ cliente_id: clienteId, departamentos });
  } catch (err) {
    next(err);
  }
});

// POST /api/fila/receber
// Body: { cliente_id, telefone, texto }
router.post('/receber', async (req, res, next) => {
  try {
    const { cliente_id, telefone, texto } = req.body;

    if (!cliente_id || !telefone || !texto) {
      return res.status(400).json({ error: 'cliente_id, telefone e texto são obrigatórios' });
    }

    const clienteId = parseInt(cliente_id, 10);
    if (clienteId !== req.usuario.cliente_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const resultado = await filaService.receberMensagem(clienteId, telefone, texto);

    const io = req.app.get('io');
    if (io && resultado.acao === 'enfileirado') {
      io.to(`cliente_${clienteId}`).emit('fila:nova_entrada', {
        telefone,
        departamento: resultado.departamento,
        posicao: resultado.posicao,
      });
    }

    return res.json(resultado);
  } catch (err) {
    next(err);
  }
});

// POST /api/fila/escolher-departamento
// Body: { cliente_id, telefone, departamento_id (integer) }
router.post('/escolher-departamento', async (req, res, next) => {
  try {
    const { cliente_id, telefone, departamento_id } = req.body;

    if (!cliente_id || !telefone || !departamento_id) {
      return res.status(400).json({ error: 'cliente_id, telefone e departamento_id são obrigatórios' });
    }

    const clienteId = parseInt(cliente_id, 10);
    if (clienteId !== req.usuario.cliente_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const depto = await departamentoService.validarDepartamento(clienteId, parseInt(departamento_id, 10));
    if (!depto) {
      return res.status(400).json({ error: `Departamento '${departamento_id}' não encontrado` });
    }

    const posicao = await filaService.enfileirar(clienteId, depto.id, telefone, '(entrada manual)');

    const io = req.app.get('io');
    if (io) {
      io.to(`cliente_${clienteId}`).emit('fila:nova_entrada', { telefone, departamento: depto, posicao });
    }

    return res.json({ mensagem: 'Entrou na fila com sucesso', departamento: depto, posicao });
  } catch (err) {
    next(err);
  }
});

// GET /api/fila/status/:cliente_id?departamento=<id>
router.get('/status/:cliente_id', autorizarClienteId, async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.cliente_id, 10);
    const deptId = req.query.departamento ? parseInt(req.query.departamento, 10) : null;

    const [fila, resumo] = await Promise.all([
      filaService.obterFila(clienteId, deptId),
      filaService.statusGeral(clienteId),
    ]);

    res.json({ cliente_id: clienteId, resumo, fila });
  } catch (err) {
    next(err);
  }
});

// POST /api/fila/atribuir
// Body: { cliente_id, departamento_id, mensagem_id }
router.post('/atribuir', async (req, res, next) => {
  try {
    const { cliente_id, departamento_id, mensagem_id } = req.body;

    if (!cliente_id || !departamento_id || !mensagem_id) {
      return res.status(400).json({ error: 'cliente_id, departamento_id e mensagem_id são obrigatórios' });
    }

    const clienteId = parseInt(cliente_id, 10);
    if (clienteId !== req.usuario.cliente_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const entrada = await filaService.atribuirAtendente(
      clienteId,
      parseInt(departamento_id, 10),
      mensagem_id,
      req.usuario.id
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`cliente_${clienteId}`).emit('fila:atribuido', { entrada, atendente: req.usuario });
    }

    return res.json({ mensagem: 'Atendente atribuído com sucesso', entrada });
  } catch (err) {
    next(err);
  }
});

// POST /api/fila/fechar
// Body: { cliente_id, departamento_id, mensagem_id }
router.post('/fechar', async (req, res, next) => {
  try {
    const { cliente_id, departamento_id, mensagem_id } = req.body;

    if (!cliente_id || !departamento_id || !mensagem_id) {
      return res.status(400).json({ error: 'cliente_id, departamento_id e mensagem_id são obrigatórios' });
    }

    const clienteId = parseInt(cliente_id, 10);
    if (clienteId !== req.usuario.cliente_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const entrada = await filaService.fecharConversa(
      clienteId,
      parseInt(departamento_id, 10),
      mensagem_id
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`cliente_${clienteId}`).emit('fila:fechado', { entrada });
    }

    return res.json({ mensagem: 'Conversa encerrada', entrada });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
