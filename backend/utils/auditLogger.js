'use strict';

const { AuditLog } = require('../models');

async function writeAuditLog({
  actorId,
  action,
  entityType,
  entityId = null,
  metadata = null,
  transaction,
}) {
  if (!actorId || !action || !entityType) {
    return null;
  }

  return AuditLog.create(
    {
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    },
    transaction ? { transaction } : undefined
  );
}

module.exports = {
  writeAuditLog,
};
