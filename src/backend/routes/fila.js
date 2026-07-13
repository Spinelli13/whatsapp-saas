'use strict';

const { Router } = require('express');
const { verificarJWT, autorizarClienteId } = require('../middleware/auth');
const filaService = require('../services/filaService');
const departamentoService = require('../services/departamentoService');

const router = Router();

router.use(verificarJWT);

// ── Departamentos ─────────────────────────────────────────────────────────

// GET /api/fila/departamentos/:cliente_id
router.get('/departamentos/:cliente_id', autorizarClienteId, async (req, res, next) => {
  try {
    const clienteId = parseInt(req.params.cliente_id, 10);
    const departamentos = await departamentoService.listarDepartamentos(clienteId);
    res.json(departamentos);
  } catch (err) {
    next(err);
  }
});

// ── Fila (queue operations) ───────────────────────────────────────────────

// POST /api/fila/receber
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
    if (io && resultado.acao === 'na_fila') {
      io.of(`/cliente-${clienteId}`).emit('fila:nova_entrada', {
        telefone,
        ticket_id: resultado.ticket_id,
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
      io.of(`/cliente-${clienteId}`).emit('fila:nova_entrada', { telefone, departamento: depto, posicao });
    }

    return res.json({ mensagem: 'Entrou na fila com sucesso', departamento: depto, posicao });
  } catch (err) {
    next(err);
  }
});

// GET /api/fila/status/:cliente_id
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
      io.of(`/cliente-${clienteId}`).emit('fila:atribuido', { entrada, atendente: req.usuario });
    }

    return res.json({ mensagem: 'Atendente atribuído com sucesso', entrada });
  } catch (err) {
    next(err);
  }
});

// POST /api/fila/fechar
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
      io.of(`/cliente-${clienteId}`).emit('fila:fechado', { entrada });
    }

    return res.json({ mensagem: 'Conversa encerrada', entrada });
  } catch (err) {
    next(err);
  }
});

// ── Ticket lifecycle ──────────────────────────────────────────────────────

// GET /api/fila/tickets/:ticket_id/historico
router.get('/tickets/:ticket_id/historico', async (req, res, next) => {
  try {
    const resultado = await filaService.obterHistoricoCompleto(
      req.params.ticket_id,
      req.usuario.cliente_id
    );
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

// POST /api/fila/tickets/:ticket_id/notas
router.post('/tickets/:ticket_id/notas', async (req, res, next) => {
  try {
    const { conteudo, privada = false } = req.body;

    if (!conteudo || conteudo.trim().length === 0) {
      return res.status(400).json({ error: 'conteudo é obrigatório e não pode estar vazio' });
    }

    const nota = await filaService.adicionarNota(
      req.params.ticket_id,
      req.usuario.id,
      req.usuario.cliente_id,
      conteudo,
      privada
    );

    const io = req.app.get('io');
    if (io) {
      io.of(`/cliente-${req.usuario.cliente_id}`).emit('nota_adicionada', {
        ticket_id: req.params.ticket_id,
        nota_id: nota.id,
        usuario_id: req.usuario.id,
        conteudo: nota.conteudo,
        privada: nota.privada,
        timestamp: new Date(),
      });
    }

    return res.status(201).json(nota);
  } catch (err) {
    next(err);
  }
});

// PUT /api/fila/tickets/:ticket_id/status
router.put('/tickets/:ticket_id/status', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status é obrigatório' });
    }

    const ticket = await filaService.mudarStatus(
      req.params.ticket_id,
      status,
      req.usuario.id,
      req.usuario.cliente_id
    );

    const io = req.app.get('io');
    if (io) {
      io.of(`/cliente-${req.usuario.cliente_id}`).emit('status_alterado', {
        ticket_id: req.params.ticket_id,
        novo_status: status,
        usuario_id: req.usuario.id,
        respondido_em: ticket.respondido_em,
        timestamp: new Date(),
      });
    }

    return res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// POST /api/fila/tickets/:ticket_id/satisfacao
router.post('/tickets/:ticket_id/satisfacao', async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating deve ser um número inteiro entre 1 e 5' });
    }

    const ticket = await filaService.adicionarSatisfacao(
      req.params.ticket_id,
      rating,
      req.usuario.cliente_id
    );

    const io = req.app.get('io');
    if (io) {
      io.of(`/cliente-${req.usuario.cliente_id}`).emit('satisfacao_adicionada', {
        ticket_id: req.params.ticket_id,
        rating,
        timestamp: new Date(),
      });
    }

    return res.json(ticket);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
