const { AuditLog } = require('../models');

/**
 * Utility to log system activities
 * @param {number} userId - ID of the user performing the action
 * @param {string} action - Description of the action (e.g., 'DELETE_USER')
 * @param {object} meta - Additional context in JSON format
 */
const logActivity = async (userId, action, meta = {}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      meta: JSON.stringify(meta),
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log audit activity:', error);
  }
};

module.exports = { logActivity };