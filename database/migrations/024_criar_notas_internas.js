'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notas_internas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      atendimento_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'atendimentos', key: 'id' },
        onDelete: 'CASCADE',
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
      },
      conteudo: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('notas_internas', ['atendimento_id'], {
      name: 'idx_notas_internas_atendimento_id',
    });
    await queryInterface.addIndex('notas_internas', ['usuario_id'], {
      name: 'idx_notas_internas_usuario_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notas_internas');
  },
};
