export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Users', 'contactEmail', {
    type: Sequelize.STRING,
  });
  await queryInterface.addColumn('Users', 'isRealEmail', {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  });
  await queryInterface.addColumn('Users', 'isDelete', {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Users', 'contactEmail');
  await queryInterface.removeColumn('Users', 'isRealEmail');
  await queryInterface.removeColumn('Users', 'isDelete');
}
