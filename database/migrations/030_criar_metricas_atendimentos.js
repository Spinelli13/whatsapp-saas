'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('metricas_atendimentos', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      atendimento_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'atendimentos', key: 'id' },
        onDelete: 'CASCADE',
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
      },
      departamento_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'departamentos', key: 'id' },
        onDelete: 'SET NULL',
      },
      tempo_espera_ms:           { type: Sequelize.INTEGER, defaultValue: 0 },
      tempo_atendimento_ms:      { type: Sequelize.INTEGER, defaultValue: 0 },
      tempo_primeira_resposta_ms:{ type: Sequelize.INTEGER, allowNull: true },
      mensagens_total:           { type: Sequelize.INTEGER, defaultValue: 0 },
      satisfacao_csat:           { type: Sequelize.INTEGER, allowNull: true },
      transferencias:            { type: Sequelize.INTEGER, defaultValue: 0 },
      finalizado:                { type: Sequelize.BOOLEAN, defaultValue: false },
      criado_em:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      atualizado_em:{ type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('metricas_atendimentos', ['cliente_id'],      { name: 'idx_metricas_cliente_id' });
    await queryInterface.addIndex('metricas_atendimentos', ['usuario_id'],      { name: 'idx_metricas_usuario_id' });
    await queryInterface.addIndex('metricas_atendimentos', ['departamento_id'], { name: 'idx_metricas_dept_id' });
    await queryInterface.addIndex('metricas_atendimentos', ['atendimento_id'],  { name: 'idx_metricas_atendimento_id' });
    await queryInterface.addIndex('metricas_atendimentos', ['criado_em'],       { name: 'idx_metricas_criado_em' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('metricas_atendimentos');
  },
};
