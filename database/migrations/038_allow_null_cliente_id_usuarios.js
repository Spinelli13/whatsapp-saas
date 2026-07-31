'use strict';

/**
 * Migration: Allow usuarios.cliente_id to be NULL
 *
 * The master user (role='master') is the owner of the system and does not
 * belong to any client, so cliente_id must be optional for that row.
 * All other roles (admin, atendente) still expect cliente_id to be set at
 * the application level.
 */

module.exports = {
  up: async (queryInterface) => {
    // queryInterface.changeColumn() silently no-ops the NOT NULL toggle on
    // this Postgres setup when combined with `references` in the same call
    // (column stayed NOT NULL despite the migration recording as applied).
    // Raw ALTER TABLE is unambiguous and matches how ALTER TYPE is done
    // elsewhere in this migration set (e.g. 034).
    await queryInterface.sequelize.query(
      'ALTER TABLE "usuarios" ALTER COLUMN "cliente_id" DROP NOT NULL;'
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE "usuarios" ALTER COLUMN "cliente_id" SET NOT NULL;'
    );
  },
};
