'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('respostas_rapidas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      titulo: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      conteudo: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      atalho: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      criado_em: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      atualizado_em: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('respostas_rapidas', ['cliente_id'], {
      name: 'idx_respostas_rapidas_cliente_id',
    });
    await queryInterface.addIndex('respostas_rapidas', ['cliente_id', 'atalho'], {
      unique: true,
      name: 'idx_respostas_rapidas_cliente_atalho',
      where: { atalho: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('respostas_rapidas');
  },
};
