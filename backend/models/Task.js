const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('todo', 'in_progress', 'done'), defaultValue: 'todo' },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
  dueDate: { type: DataTypes.DATEONLY },
  projectId: { type: DataTypes.UUID, allowNull: false },
  assigneeId: { type: DataTypes.UUID },
  creatorId: { type: DataTypes.UUID, allowNull: false },
}, { timestamps: true });

module.exports = Task;
