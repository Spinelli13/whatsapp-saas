'use strict';

// Adds single-column indexes not covered by the composite indexes in migrations 016-020.
module.exports = {
  async up(queryInterface) {
    // oportunidades: usuario_id and criado_em not yet indexed individually
    await queryInterface.addIndex('oportunidades', ['usuario_id'], {
      name: 'idx_oportunidades_usuario_id',
    });
    await queryInterface.addIndex('oportunidades', ['criado_em'], {
      name: 'idx_oportunidades_criado_em',
    });

    // tarefas: criado_em not yet indexed individually
    await queryInterface.addIndex('tarefas', ['criado_em'], {
      name: 'idx_tarefas_criado_em',
    });

    // emails: criado_em not yet indexed individually
    await queryInterface.addIndex('emails', ['criado_em'], {
      name: 'idx_emails_criado_em',
    });

    // sms: criado_em not yet indexed individually
    await queryInterface.addIndex('sms', ['criado_em'], {
      name: 'idx_sms_criado_em',
    });

    // previsoes_ia: oportunidade_id for IA lookups
    await queryInterface.addIndex('previsoes_ia', ['oportunidade_id'], {
      name: 'idx_previsoes_ia_oportunidade_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('oportunidades', 'idx_oportunidades_usuario_id');
    await queryInterface.removeIndex('oportunidades', 'idx_oportunidades_criado_em');
    await queryInterface.removeIndex('tarefas', 'idx_tarefas_criado_em');
    await queryInterface.removeIndex('emails', 'idx_emails_criado_em');
    await queryInterface.removeIndex('sms', 'idx_sms_criado_em');
    await queryInterface.removeIndex('previsoes_ia', 'idx_previsoes_ia_oportunidade_id');
  },
};
