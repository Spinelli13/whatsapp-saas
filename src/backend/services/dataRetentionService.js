'use strict';

const { DataRetentionPolicy, AuditLog, sequelize } = require('../models');
const { Op } = require('sequelize');
const { NODE_ENV } = require('../config/environment');

class DataRetentionService {
  static async obterPolitica(clienteId) {
    let politica = await DataRetentionPolicy.findOne({ where: { cliente_id: clienteId } });

    if (!politica) {
      politica = await DataRetentionPolicy.create({
        cliente_id: clienteId,
        dias_retencao_historico: 180,
        dias_retencao_logs: 90,
        deletar_automaticamente: true,
      });
    }

    return politica;
  }

  static async atualizarPolitica(clienteId, dados) {
    const camposPermitidos = ['dias_retencao_historico', 'dias_retencao_logs', 'deletar_automaticamente'];
    const update = {};
    for (const campo of camposPermitidos) {
      if (dados[campo] !== undefined) update[campo] = dados[campo];
    }
    update.atualizado_em = new Date();

    let politica = await DataRetentionPolicy.findOne({ where: { cliente_id: clienteId } });

    if (!politica) {
      politica = await DataRetentionPolicy.create({ cliente_id: clienteId, ...update });
    } else {
      await politica.update(update);
    }

    return politica;
  }

  static async executarCleanup(clienteId) {
    const politica = await this.obterPolitica(clienteId);

    if (!politica.deletar_automaticamente) {
      return { historicoDeleted: 0, logsDeleted: 0 };
    }

    const dataLimiteHistorico = new Date();
    dataLimiteHistorico.setDate(dataLimiteHistorico.getDate() - politica.dias_retencao_historico);

    // HistoricoTicket has no cliente_id — join via fila_mensagens
    const [historicoResult] = await sequelize.query(
      `DELETE FROM historico_tickets
       WHERE ticket_id IN (
         SELECT id FROM fila_mensagens WHERE cliente_id = :clienteId
       )
       AND criado_em < :dataLimite`,
      { replacements: { clienteId, dataLimite: dataLimiteHistorico } }
    );

    const dataLimiteLogs = new Date();
    dataLimiteLogs.setDate(dataLimiteLogs.getDate() - politica.dias_retencao_logs);

    const logsDeleted = await AuditLog.destroy({
      where: {
        cliente_id: clienteId,
        criado_em: { [Op.lt]: dataLimiteLogs },
      },
    });

    return { historicoDeleted: historicoResult || 0, logsDeleted };
  }

  static agendarCleanup() {
    if (NODE_ENV === 'test') return;

    const schedule = require('node-schedule');
    schedule.scheduleJob('0 2 * * *', async () => {
      console.log('[CRON] Executando data retention cleanup...');
      try {
        const { Cliente } = require('../models');
        const clientes = await Cliente.findAll({ attributes: ['id'] });
        for (const cliente of clientes) {
          await this.executarCleanup(cliente.id);
        }
        console.log('✓ Cleanup completo');
      } catch (error) {
        console.error('Erro no cleanup agendado:', error.message);
      }
    });

    console.log('✓ Cleanup agendado para 2 AM diariamente');
  }
}

module.exports = DataRetentionService;
