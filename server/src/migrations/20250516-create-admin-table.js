import { Sequelize } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Admins', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    loginId: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    adminName: {
      type: Sequelize.STRING,
    },
    avatar: {
      type: Sequelize.STRING,
    },
    lastPasswordChange: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    contactEmail: {
      type: Sequelize.STRING,
    },
    isRealEmail: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    employeeId: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  });
};

export const down = async (queryInterface) => {
  await queryInterface.dropTable('Admins');
};