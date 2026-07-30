'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transferencias', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
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
      atendente_origem_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
      },
      atendente_destino_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
      },
      motivo: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pendente', 'aceita', 'rejeitada', 'cancelada'),
        defaultValue: 'pendente',
      },
      departamento_destino_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'departamentos', key: 'id' },
        onDelete: 'SET NULL',
      },
      mensagem_rejeicao: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      criado_em: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      atualizado_em: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('transferencias', ['atendimento_id'],    { name: 'idx_transferencias_atendimento_id' });
    await queryInterface.addIndex('transferencias', ['cliente_id'],        { name: 'idx_transferencias_cliente_id' });
    await queryInterface.addIndex('transferencias', ['atendente_origem_id'], { name: 'idx_transferencias_origem_id' });
    await queryInterface.addIndex('transferencias', ['atendente_destino_id'], { name: 'idx_transferencias_destino_id' });
    await queryInterface.addIndex('transferencias', ['status'],            { name: 'idx_transferencias_status' });
    await queryInterface.addIndex('transferencias', ['criado_em'],         { name: 'idx_transferencias_criado_em' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transferencias');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transferencias_status"');
  },
};
