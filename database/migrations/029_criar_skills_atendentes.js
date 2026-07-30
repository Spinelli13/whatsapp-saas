'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('skills_atendentes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE',
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onDelete: 'CASCADE',
      },
      nome_skill: { type: Sequelize.STRING(100), allowNull: false },
      nivel: {
        type: Sequelize.ENUM('basico', 'intermediario', 'avancado'),
        defaultValue: 'basico',
      },
      ativo: { type: Sequelize.BOOLEAN, defaultValue: true },
      criado_em: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      atualizado_em: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('skills_atendentes', ['usuario_id'], { name: 'idx_skills_usuario_id' });
    await queryInterface.addIndex('skills_atendentes', ['cliente_id'], { name: 'idx_skills_cliente_id' });
    await queryInterface.addIndex('skills_atendentes', ['nome_skill'], { name: 'idx_skills_nome_skill' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('skills_atendentes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_skills_atendentes_nivel"');
  },
};
