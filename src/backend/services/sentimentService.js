'use strict';

const { AnaliseSentimento } = require('../models');

class SentimentService {
  static async analisar(clienteId, dados) {
    if (!dados.texto) throw new Error('Texto é obrigatório');

    const analise = SentimentService.classificarSentimento(dados.texto);

    return AnaliseSentimento.create({
      cliente_id: clienteId,
      email_id: dados.email_id || null,
      sms_id: dados.sms_id || null,
      texto: dados.texto,
      sentimento: analise.sentimento,
      confianca: analise.confianca,
      palavras_chave: analise.palavras_chave,
    });
  }

  static classificarSentimento(texto) {
    const lower = texto.toLowerCase();
    const posWords = ['excelente', 'ótimo', 'maravilha', 'perfeito', 'adorei', 'bom', 'ótima', 'parabéns', 'feliz'];
    const negWords = ['ruim', 'pior', 'horrível', 'problema', 'erro', 'péssimo', 'terrível', 'raiva', 'decepcionante'];

    const positivas = posWords.filter((p) => lower.includes(p)).length;
    const negativas = negWords.filter((n) => lower.includes(n)).length;

    let sentimento = 'neutro';
    let confianca = 0.5;

    if (positivas > negativas) {
      sentimento = 'positivo';
      confianca = Math.min(0.95, 0.5 + positivas * 0.1);
    } else if (negativas > positivas) {
      sentimento = 'negativo';
      confianca = Math.min(0.95, 0.5 + negativas * 0.1);
    }

    const palavras_chave = [...new Set(
      lower.split(/\s+/).filter((p) => p.length > 3).slice(0, 5)
    )];

    return {
      sentimento,
      confianca: parseFloat(confianca.toFixed(2)),
      palavras_chave,
    };
  }

  static async listar(clienteId, filtros = {}) {
    const where = { cliente_id: clienteId };
    if (filtros.sentimento) where.sentimento = filtros.sentimento;

    return AnaliseSentimento.findAll({
      where,
      order: [['criado_em', 'DESC']],
      limit: filtros.limit ? parseInt(filtros.limit, 10) : 50,
    });
  }
}

module.exports = SentimentService;
