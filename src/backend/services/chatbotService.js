'use strict';

const { FluxoBot, RespostaAutomatica } = require('../models');

// Palavras por sentimento e urgência usadas na análise
const POSITIVOS  = ['obrigado', 'ótimo', 'excelente', 'perfeito', 'satisfeito', 'parabéns', 'bom', 'adorei', 'ótima'];
const NEGATIVOS  = ['ruim', 'péssimo', 'problema', 'reclamação', 'insatisfeito', 'horrível', 'erro', 'falha', 'demora'];
const URGENTES   = ['urgente', 'agora', 'imediato', 'emergência', 'emergencia', 'crítico', 'critico', 'grave'];

const INTENTS = {
  suporte:    ['problema', 'erro', 'não funciona', 'ajuda', 'suporte', 'falha', 'bug'],
  vendas:     ['preço', 'comprar', 'valor', 'proposta', 'produto', 'serviço', 'orçamento'],
  financeiro: ['pagamento', 'boleto', 'fatura', 'cobrança', 'débito', 'pagar'],
  informacao: ['informação', 'dúvida', 'como', 'qual', 'quando', 'onde', 'o que'],
};

class ChatbotService {
  /**
   * Analisa uma mensagem e retorna sentimento, urgência, intent e palavras-chave.
   * Lógica baseada em correspondência de keywords — sem chamada de API externa.
   */
  static analisar(mensagem) {
    const texto = (mensagem || '').toLowerCase().trim();

    // Sentimento
    const qtdPos = POSITIVOS.filter((p) => texto.includes(p)).length;
    const qtdNeg = NEGATIVOS.filter((n) => texto.includes(n)).length;

    let sentimento = 'neutro';
    if (qtdPos > qtdNeg) sentimento = 'positivo';
    if (qtdNeg > qtdPos) sentimento = 'negativo';

    // Urgência
    const ehUrgente = URGENTES.some((u) => texto.includes(u));
    let urgencia = 'baixa';
    if (ehUrgente) urgencia = 'alta';
    else if (qtdNeg > 0) urgencia = 'media';

    // Intent (primeira correspondência vence)
    let intent = 'geral';
    for (const [chave, palavras] of Object.entries(INTENTS)) {
      if (palavras.some((p) => texto.includes(p))) {
        intent = chave;
        break;
      }
    }

    // Palavras-chave (tokens com mais de 4 caracteres, sem repetição, até 5)
    const palavras_chave = [...new Set(
      mensagem.split(/\s+/).filter((w) => w.length > 4)
    )].slice(0, 5);

    return { sentimento, urgencia, intent, palavras_chave };
  }

  // ── Respostas Automáticas ─────────────────────────────────────────────────────

  static async buscarRespostaAutomatica(clienteId, texto) {
    const respostas = await RespostaAutomatica.findAll({
      where: { cliente_id: clienteId, ativo: true },
    });

    for (const resp of respostas) {
      let match = false;
      if (resp.tipo === 'exato') {
        match = resp.palavra_chave.toLowerCase() === texto.toLowerCase();
      } else if (resp.tipo === 'contem') {
        match = texto.toLowerCase().includes(resp.palavra_chave.toLowerCase());
      } else if (resp.tipo === 'regex') {
        try {
          match = new RegExp(resp.palavra_chave, 'i').test(texto);
        } catch { match = false; }
      }
      if (match) return resp;
    }
    return null;
  }

  // ── Execução de Fluxo ─────────────────────────────────────────────────────────

  static async procesarMensagem(clienteId, telefone, texto) {
    const autoResp = await this.buscarRespostaAutomatica(clienteId, texto);
    if (autoResp) {
      return { tipo: 'resposta_automatica', resposta: autoResp.resposta, encerrado: true };
    }

    const fluxo = await FluxoBot.findOne({ where: { cliente_id: clienteId, ativo: true } });
    if (!fluxo) return { tipo: 'nenhuma_acao', resposta: null };

    return this.executarFluxo(fluxo, texto);
  }

  static async executarFluxo(fluxo, respostaUsuario) {
    const { nodes, edges } = fluxo.estrutura_json || { nodes: [], edges: [] };

    if (!nodes.length) {
      return { tipo: 'nenhuma_acao', resposta: fluxo.mensagem_saudacao || 'Olá!' };
    }

    let noCurrent = nodes.find((n) => n.data?.tipo === 'inicio') || nodes[0];
    let iteracoes = 0;

    while (noCurrent && iteracoes < 20) {
      iteracoes++;

      if (noCurrent.data?.tipo === 'transferencia') {
        return {
          tipo: 'fim_fluxo_com_transferencia',
          resposta: noCurrent.data?.conteudo || 'Transferindo para atendente...',
          encerrado: true,
        };
      }

      if (noCurrent.data?.tipo === 'pergunta') {
        return {
          tipo: 'aguardando',
          resposta: noCurrent.data?.conteudo || 'Pergunta?',
          proximoNoId: noCurrent.id,
        };
      }

      if (noCurrent.data?.tipo === 'condicao') {
        const cond = noCurrent.data?.condicao;
        const bateu =
          cond?.tipo === 'contém' ? respostaUsuario.includes(cond.valor) :
          cond?.tipo === 'não contém' ? !respostaUsuario.includes(cond.valor) :
          false;
        noCurrent = this._proximoNo(nodes, edges, noCurrent.id, bateu ? 'sim' : 'não');
      } else if (noCurrent.data?.tipo === 'mensagem') {
        const resposta = noCurrent.data?.conteudo || '';
        noCurrent = this._proximoNo(nodes, edges, noCurrent.id);
        if (!noCurrent) return { tipo: 'fim_fluxo', resposta, encerrado: true };
      } else {
        noCurrent = this._proximoNo(nodes, edges, noCurrent.id);
      }
    }

    return { tipo: 'fim_fluxo', resposta: fluxo.mensagem_despedida || 'Até logo!', encerrado: true };
  }

  static _proximoNo(nodes, edges, noAtualId, rotulo = null) {
    const edge = rotulo
      ? edges.find((e) => e.source === noAtualId && e.label === rotulo)
      : edges.find((e) => e.source === noAtualId);
    return edge ? nodes.find((n) => n.id === edge.target) : null;
  }

  // ── CRUD Fluxos ───────────────────────────────────────────────────────────────

  static async listarFluxos(clienteId) {
    return FluxoBot.findAll({
      where: { cliente_id: clienteId },
      attributes: ['id', 'nome', 'descricao', 'ativo', 'criado_em'],
      order: [['criado_em', 'DESC']],
    });
  }

  static async obterFluxo(clienteId, id) {
    const fluxo = await FluxoBot.findOne({ where: { id, cliente_id: clienteId } });
    if (!fluxo) {
      const err = new Error('Fluxo não encontrado');
      err.status = 404;
      throw err;
    }
    return fluxo;
  }

  static async criarFluxo(clienteId, { nome, descricao, mensagem_saudacao, mensagem_despedida }) {
    if (!nome?.trim()) {
      const err = new Error('Nome obrigatório');
      err.status = 400;
      throw err;
    }
    return FluxoBot.create({
      cliente_id: clienteId,
      nome: nome.trim(),
      descricao: descricao || null,
      mensagem_saudacao: mensagem_saudacao || 'Olá!',
      mensagem_despedida: mensagem_despedida || 'Até logo!',
      estrutura_json: { nodes: [], edges: [] },
    });
  }

  static async atualizarFluxo(clienteId, id, dados) {
    const fluxo = await this.obterFluxo(clienteId, id);
    return fluxo.update(dados);
  }

  static async deletarFluxo(clienteId, id) {
    const fluxo = await this.obterFluxo(clienteId, id);
    await fluxo.destroy();
    return { sucesso: true };
  }

  static async ativarFluxo(clienteId, id) {
    await FluxoBot.update({ ativo: false }, { where: { cliente_id: clienteId } });
    const fluxo = await this.obterFluxo(clienteId, id);
    await fluxo.update({ ativo: true });
    return fluxo;
  }

  static testarFluxo(estrutura, respostaUsuario = '') {
    const { nodes, edges } = estrutura || { nodes: [], edges: [] };
    if (!nodes.length) return { passos: [{ resultado: 'Fluxo vazio' }] };

    let noCurrent = nodes.find((n) => n.data?.tipo === 'inicio') || nodes[0];
    const passos = [];
    let iteracoes = 0;

    while (noCurrent && iteracoes < 20) {
      iteracoes++;
      passos.push({ noId: noCurrent.id, tipo: noCurrent.data?.tipo, conteudo: noCurrent.data?.conteudo });

      if (noCurrent.data?.tipo === 'transferencia') {
        passos.push({ resultado: 'TRANSFERIR PARA ATENDENTE' });
        break;
      }
      if (noCurrent.data?.tipo === 'pergunta') {
        passos.push({ resultado: `AGUARDANDO RESPOSTA: "${respostaUsuario}"` });
        break;
      }
      noCurrent = this._proximoNo(nodes, edges, noCurrent.id);
    }

    return { passos };
  }
}

module.exports = ChatbotService;
