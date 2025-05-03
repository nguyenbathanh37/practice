'use strict';
export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert('Users', [{
    email: 'admin@example.com',
    password: 'hashedPassword',
    name: 'Demo Admin',
    avatar: 'https://example.com/avatar.jpg',
    lastPasswordChange: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }], {});
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Users', null, {});
}
