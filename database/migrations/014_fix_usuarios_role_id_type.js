'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableDescription = await queryInterface.describeTable('usuarios');

      if (tableDescription.role_id) {
        // Drop FK constraint if it exists
        try {
          await queryInterface.sequelize.query(
            `ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_role_id_fkey`
          );
        } catch (e) {
          console.log('No FK constraint to drop');
        }

        // Only recreate if the column is NOT already INTEGER
        const colType = tableDescription.role_id.type;
        if (colType && colType.toLowerCase().includes('integer')) {
          console.log('✓ role_id já é INTEGER — nenhuma alteração necessária');
          return;
        }

        await queryInterface.removeColumn('usuarios', 'role_id');
      }

      await queryInterface.addColumn('usuarios', 'role_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'roles', key: 'id' },
        onDelete: 'SET NULL',
      });

      console.log('✓ role_id corrigido para INTEGER com FK');
    } catch (error) {
      console.error('Error in migration:', error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeColumn('usuarios', 'role_id');
    } catch (error) {
      console.error('Error rolling back:', error.message);
      throw error;
    }
  },
};
