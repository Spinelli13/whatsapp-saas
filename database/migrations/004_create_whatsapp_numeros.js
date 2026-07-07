'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('whatsapp_numeros', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      numero: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pendente', 'ativo', 'desconectado'),
        allowNull: false,
        defaultValue: 'pendente',
      },
      integrado_em: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ultima_msg: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('whatsapp_numeros', ['cliente_id'], {
      name: 'whatsapp_numeros_cliente_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('whatsapp_numeros');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_whatsapp_numeros_status";');
  },
};
