import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Admin = sequelize.define('Admin', {
  loginId: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  adminName: { type: DataTypes.STRING },
  avatar: { type: DataTypes.STRING },
  lastPasswordChange: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  contactEmail: { type: DataTypes.STRING },
  isRealEmail: { type: DataTypes.BOOLEAN, defaultValue: false },
  employeeId: { type: DataTypes.STRING, unique: true, allowNull: false },
  passwordHistory: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('passwordHistory');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('passwordHistory', JSON.stringify(value || []));
    }
  }
});

export default Admin;