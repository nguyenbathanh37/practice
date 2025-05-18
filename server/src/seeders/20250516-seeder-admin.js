import bcrypt from 'bcryptjs';

export const up = async (queryInterface) => {
  const hashedPassword = bcrypt.hashSync('Abcd1234@', 10); // Hash the password

  await queryInterface.bulkInsert('Admins', [
    {
      loginId: 'admin1@example.com',
      password: hashedPassword,
      adminName: 'Admin One',
      avatar: 'https://example.com/avatar1.png',
      lastPasswordChange: new Date(),
      contactEmail: 'thanhnguyen240202@gmail.com',
      isRealEmail: true,
      employeeId: 'EMP001',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      loginId: 'admin2@example.com',
      password: hashedPassword,
      adminName: 'Admin Two',
      avatar: 'https://example.com/avatar2.png',
      lastPasswordChange: new Date(),
      contactEmail: 'thanhnguyen240202@gmail.com',
      isRealEmail: true,
      employeeId: 'EMP002',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
};

export const down = async (queryInterface) => {
  await queryInterface.bulkDelete('Admins', null, {});
};