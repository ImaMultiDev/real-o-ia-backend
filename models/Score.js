// real-o-ia-backend/models/Score.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Score = sequelize.define('Score', {
  bestScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  attemptsLeft: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  lastAttemptDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  timestamps: true
});

// Establecer la relación entre User y Score
User.hasOne(Score, { foreignKey: 'userId' });
Score.belongsTo(User, { foreignKey: 'userId' });

module.exports = Score;
