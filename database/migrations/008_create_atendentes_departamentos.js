'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('atendentes_departamentos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      departamento_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'departamentos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('ativo', 'inativo'),
        allowNull: false,
        defaultValue: 'ativo',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('atendentes_departamentos', ['usuario_id', 'departamento_id'], {
      unique: true,
      name: 'atendentes_dept_unique',
    });
    await queryInterface.addIndex('atendentes_departamentos', ['departamento_id', 'status'], {
      name: 'atendentes_dept_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('atendentes_departamentos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_atendentes_departamentos_status";');
  },
};
