const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  name: DataTypes.STRING,
  avatar: DataTypes.STRING,
  lastPasswordChange: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = User;