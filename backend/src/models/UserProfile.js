const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database/config');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [10, 20]
    }
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true,
      isPast(value) {
        if (value && new Date(value) >= new Date()) {
          throw new Error('Date of birth must be in the past');
        }
      }
    }
  },
  profile_image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'user_profiles',
  timestamps: true,
  underscored: true
});

module.exports = UserProfile; 