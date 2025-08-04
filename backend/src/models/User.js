const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database/config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'buyer'),
    defaultValue: 'buyer',
    allowNull: false
  },
  google_id: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  email_verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  password_reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  password_reset_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`;
};

User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

User.prototype.isLocked = function() {
  return this.locked_until && this.locked_until > new Date();
};

User.prototype.incrementLoginAttempts = async function() {
  this.login_attempts += 1;
  if (this.login_attempts >= 5) {
    this.locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
  await this.save();
};

User.prototype.resetLoginAttempts = async function() {
  this.login_attempts = 0;
  this.locked_until = null;
  this.last_login = new Date();
  await this.save();
};

// Class methods
User.findByEmail = function(email) {
  return this.findOne({ where: { email } });
};

User.findByGoogleId = function(googleId) {
  return this.findOne({ where: { google_id: googleId } });
};

User.createGoogleUser = async function(googleData) {
  return await this.create({
    email: googleData.email,
    first_name: googleData.first_name || googleData.given_name,
    last_name: googleData.last_name || googleData.family_name,
    google_id: googleData.id,
    email_verified: true,
    password: Math.random().toString(36).slice(-8) // Generate random password
  });
};

module.exports = User; 