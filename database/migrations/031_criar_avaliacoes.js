'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('avaliacoes', {
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
      nota_csat:  { type: Sequelize.INTEGER, allowNull: false },
      nota_nps:   { type: Sequelize.INTEGER, allowNull: true },
      comentario: { type: Sequelize.TEXT, allowNull: true },
      criado_em:    { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      atualizado_em:{ type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('avaliacoes', ['atendimento_id'], { name: 'idx_avaliacoes_atendimento_id' });
    await queryInterface.addIndex('avaliacoes', ['cliente_id'],     { name: 'idx_avaliacoes_cliente_id' });
    await queryInterface.addIndex('avaliacoes', ['usuario_id'],     { name: 'idx_avaliacoes_usuario_id' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('avaliacoes');
  },
};
