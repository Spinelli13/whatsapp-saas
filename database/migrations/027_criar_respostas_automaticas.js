'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('respostas_automaticas', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      palavra_chave: { type: Sequelize.STRING(100), allowNull: false },
      resposta: { type: Sequelize.TEXT, allowNull: false },
      tipo: {
        type: Sequelize.ENUM('exato', 'contem', 'regex'),
        defaultValue: 'exato',
      },
      ativo: { type: Sequelize.BOOLEAN, defaultValue: true },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('respostas_automaticas', ['cliente_id'], { name: 'idx_respostas_automaticas_cliente_id' });
    await queryInterface.addIndex('respostas_automaticas', ['palavra_chave'], { name: 'idx_respostas_automaticas_palavra_chave' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('respostas_automaticas');
  },
};
