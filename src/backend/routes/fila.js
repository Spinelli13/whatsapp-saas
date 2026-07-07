const { Router } = require('express');
const { verificarJWT, autorizarClienteId } = require('../middleware/auth');
const filaService = require('../services/filaService');
const departamentoService = require('../services/departamentoService');

const router = Router();

router.use(verificarJWT);

// GET /api/fila/departamentos/:cliente_id
// Lista departamentos disponíveis para o cliente
router.get('/departamentos/:cliente_id', autorizarClienteId, (req, res) => {
  const clienteId = parseInt(req.params.cliente_id, 10);
  const departamentos = departamentoService.listarDepartamentos(clienteId);
  res.json({ cliente_id: clienteId, departamentos });
});

// POST /api/fila/receber
// Simula recebimento de mensagem pelo Baileys (também chamado internamente)
// Body: { cliente_id, telefone, texto }
router.post('/receber', (req, res, next) => {
  try {
    const { cliente_id, telefone, texto } = req.body;

    if (!cliente_id || !telefone || !texto) {
      return res.status(400).json({ error: 'cliente_id, telefone e texto são obrigatórios' });
    }

    const clienteId = parseInt(cliente_id, 10);
    if (clienteId !== req.usuario.cliente_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const resultado = filaService.receberMensagem(clienteId, telefone, texto);

    // Emitir evento Socket.io para painel em tempo real
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
// Enfileira manualmente (sem passar pelo menu de texto)
// Body: { cliente_id, telefone, departamento_id }
router.post('/escolher-departamento', (req, res, next) => {
  try {
    const { cliente_id, telefone, departamento_id } = req.body;

    if (!cliente_id || !telefone || !departamento_id) {
      return res.status(400).json({ error: 'cliente_id, telefone e departamento_id são obrigatórios' });
    }

    const clienteId = parseInt(cliente_id, 10);
    if (clienteId !== req.usuario.cliente_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const depto = departamentoService.validarDepartamento(clienteId, departamento_id);
    if (!depto) {
      return res.status(400).json({ error: `Departamento '${departamento_id}' não encontrado` });
    }

    const posicao = filaService.enfileirar(clienteId, departamento_id, telefone, '(entrada manual)');

    const io = req.app.get('io');
    if (io) {
      io.to(`cliente_${clienteId}`).emit('fila:nova_entrada', { telefone, departamento: depto, posicao });
    }

    return res.json({ mensagem: 'Entrou na fila com sucesso', departamento: depto, posicao });
  } catch (err) {
    next(err);
  }
});

// GET /api/fila/status/:cliente_id?departamento=vendas
// Mostra fila atual (todos os departamentos ou um específico)
router.get('/status/:cliente_id', autorizarClienteId, (req, res) => {
  const clienteId = parseInt(req.params.cliente_id, 10);
  const { departamento } = req.query;
  const fila = filaService.obterFila(clienteId, departamento || null);
  const resumo = filaService.statusGeral(clienteId);
  res.json({ cliente_id: clienteId, resumo, fila });
});

// POST /api/fila/atribuir
// Atribui próximo da fila a um atendente
// Body: { cliente_id, departamento_id, mensagem_id }
router.post('/atribuir', (req, res, next) => {
  try {
    const { cliente_id, departamento_id, mensagem_id } = req.body;

    if (!cliente_id || !departamento_id || !mensagem_id) {
      return res.status(400).json({ error: 'cliente_id, departamento_id e mensagem_id são obrigatórios' });
    }

    const clienteId = parseInt(cliente_id, 10);
    if (clienteId !== req.usuario.cliente_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const entrada = filaService.atribuirAtendente(clienteId, departamento_id, mensagem_id, req.usuario.id);

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
// Fecha conversa
// Body: { cliente_id, departamento_id, mensagem_id }
router.post('/fechar', (req, res, next) => {
  try {
    const { cliente_id, departamento_id, mensagem_id } = req.body;

    if (!cliente_id || !departamento_id || !mensagem_id) {
      return res.status(400).json({ error: 'cliente_id, departamento_id e mensagem_id são obrigatórios' });
    }

    const clienteId = parseInt(cliente_id, 10);
    if (clienteId !== req.usuario.cliente_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const entrada = filaService.fecharConversa(clienteId, departamento_id, mensagem_id);

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
