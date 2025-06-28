const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

class User extends Model {
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  changedPasswordAfter(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(new Date(this.passwordChangedAt).getTime() / 1000, 10);
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  }

  isLocked() {
    return this.lockedUntil && new Date(this.lockedUntil) > new Date();
  }

  async registerFailedLogin() {
    this.loginAttempts += 1;
    
    if (this.loginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    
    await this.save();
  }

  async resetLoginAttempts() {
    this.loginAttempts = 0;
    this.lockedUntil = null;
    await this.save();
  }
}

User.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome é obrigatório' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Por favor, informe um email válido' },
      notEmpty: { msg: 'O email é obrigatório' }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase());
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [6, 100],
        msg: 'A senha deve ter pelo menos 6 caracteres'
      }
    }
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true, 
  defaultScope: {
    attributes: { exclude: ['password', 'active'] } 
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] }
    }
  }
});

User.beforeSave(async (user) => {
  if (!user.changed('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
    
    if (!user.isNewRecord) {
      user.passwordChangedAt = new Date(Date.now() - 1000);
    }
  } catch (error) {
    throw new Error(`Erro ao gerar hash da senha: ${error.message}`);
  }
});

User.addScope('defaultScope', {
  where: {
    active: true
  }
});

module.exports = User;
