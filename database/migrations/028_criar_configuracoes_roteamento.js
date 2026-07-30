'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('configuracoes_roteamento', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      departamento_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'departamentos', key: 'id' },
        onDelete: 'SET NULL',
      },
      tipo_roteamento: {
        type: Sequelize.ENUM('round_robin', 'least_busy', 'skill', 'manual'),
        defaultValue: 'least_busy',
      },
      limite_simultaneos: { type: Sequelize.INTEGER, defaultValue: 10 },
      tempo_sla_minutos: { type: Sequelize.INTEGER, defaultValue: 5 },
      habilitar_transbordo: { type: Sequelize.BOOLEAN, defaultValue: true },
      departamento_transbordo_id: { type: Sequelize.INTEGER, allowNull: true },
      ativo: { type: Sequelize.BOOLEAN, defaultValue: true },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('configuracoes_roteamento', ['cliente_id'], { name: 'idx_config_roteamento_cliente_id' });
    await queryInterface.addIndex('configuracoes_roteamento', ['departamento_id'], { name: 'idx_config_roteamento_dept_id' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('configuracoes_roteamento');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_configuracoes_roteamento_tipo_roteamento"');
  },
};
