'use strict';

/**
 *  Migration: adjust Users table to new schema
 *  - email      ➜ loginId   (rename)
 *  - name       ➜ userName  (rename)
 *  - add            employeeId
 *  - drop           isDelete
 */
export default {
  up: async (queryInterface, Sequelize) => {
    // 1. RENAME COLUMNS (keeps the existing data intact)
    await queryInterface.renameColumn('Users', 'email', 'loginId');
    await queryInterface.renameColumn('Users', 'name',  'userName');

    // 2. ADD NEW COLUMN employeeId
    await queryInterface.addColumn('Users', 'employeeId', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });

    // 3. REMOVE isDelete COLUMN (no longer in the model)
    await queryInterface.removeColumn('Users', 'isDelete');
  },

  down: async (queryInterface, Sequelize) => {
    // 1. RE‑ADD isDelete
    await queryInterface.addColumn('Users', 'isDelete', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    // 2. DROP employeeId
    await queryInterface.removeColumn('Users', 'employeeId');

    // 3. REVERT COLUMN NAMES
    await queryInterface.renameColumn('Users', 'userName', 'name');
    await queryInterface.renameColumn('Users', 'loginId',  'email');
  },
};
