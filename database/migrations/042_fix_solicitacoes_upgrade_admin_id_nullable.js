'use strict';

/**
 * Migration: Allow solicitacoes_upgrade.admin_id to be NULL
 *
 * Migration 037 defined admin_id as `allowNull: false` combined with
 * `onDelete: 'SET NULL'` — a contradiction: Postgres would reject the
 * DELETE on the referenced usuario with a not-null violation the moment
 * the ON DELETE SET NULL action tries to fire. Using raw SQL rather than
 * queryInterface.changeColumn() since changeColumn silently failed to
 * toggle NOT NULL on this same Postgres setup in migration 038.
 */

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE "solicitacoes_upgrade" ALTER COLUMN "admin_id" DROP NOT NULL;'
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE "solicitacoes_upgrade" ALTER COLUMN "admin_id" SET NOT NULL;'
    );
  },
};
