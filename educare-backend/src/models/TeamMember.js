const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'teams',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  role: {
    type: DataTypes.ENUM,
    values: ['admin', 'member', 'viewer', 'professional'],
    defaultValue: 'member'
  },
  invitedBy: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  invitedAt: {
    type: DataTypes.DATE
  },
  joinedAt: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM,
    values: ['invited', 'active', 'inactive', 'removed'],
    defaultValue: 'invited'
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'team_members',
  timestamps: true
});

module.exports = TeamMember;
