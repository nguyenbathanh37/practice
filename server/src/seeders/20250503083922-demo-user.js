'use strict';
import bcrypt from 'bcryptjs';
export async function up(queryInterface, Sequelize) {
  const hashedPassword = await bcrypt.hash('Admin1234@', 10);

  await queryInterface.bulkInsert('Users', [{
    email: 'admin@example.com',
    password: hashedPassword,
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
