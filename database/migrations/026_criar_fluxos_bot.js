'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('fluxos_bot', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      nome: { type: Sequelize.STRING(100), allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      estrutura_json: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: { nodes: [], edges: [] },
      },
      mensagem_saudacao: { type: Sequelize.TEXT, allowNull: true },
      mensagem_despedida: { type: Sequelize.TEXT, allowNull: true },
      ativo: { type: Sequelize.BOOLEAN, defaultValue: false },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('fluxos_bot', ['cliente_id'], { name: 'idx_fluxos_bot_cliente_id' });
    await queryInterface.addIndex('fluxos_bot', ['ativo'], { name: 'idx_fluxos_bot_ativo' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('fluxos_bot');
  },
};
