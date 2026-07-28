'use strict';

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
}

module.exports = ChatbotService;
