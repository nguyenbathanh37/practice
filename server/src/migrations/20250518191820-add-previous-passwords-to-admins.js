'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Admins', 'passwordHistory', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
}
export async function down(queryInterface) {
  await queryInterface.removeColumn('Admins', 'passwordHistory');
}
