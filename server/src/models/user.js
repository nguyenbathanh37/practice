import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  name: DataTypes.STRING,
  avatar: DataTypes.STRING,
  lastPasswordChange: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

export default User;