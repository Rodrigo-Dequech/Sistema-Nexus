import { AuditLog } from '../models/index.js';

export async function registerAudit({ entity, entityId, action, performedBy, payload }) {
  await AuditLog.create({ entity, entityId, action, performedBy, payload });
}
