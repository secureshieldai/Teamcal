const { supabase } = require("../config/supabase");

/**
 * Audit log service for tracking critical operations
 */

const AUDIT_ACTIONS = {
  // Financial
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_REFUNDED: 'order.refunded',
  PAYOUT_REQUESTED: 'payout.requested',
  PAYOUT_COMPLETED: 'payout.completed',
  
  // Admin
  ADMIN_USER_UPDATED: 'admin.user.updated',
  ADMIN_USER_DELETED: 'admin.user.deleted',
  ADMIN_PRODUCT_DELETED: 'admin.product.deleted',
  ADMIN_POST_DELETED: 'admin.post.deleted',
  
  // Security
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  PASSWORD_CHANGED: 'auth.password.changed',
  EMAIL_CHANGED: 'auth.email.changed',
  
  // Data
  DATA_EXPORTED: 'data.exported',
  DATA_DELETED: 'data.deleted',
};

/**
 * Log an audit event
 * @param {Object} params
 * @param {string} params.userId - User who performed the action
 * @param {string} params.action - Action type (use AUDIT_ACTIONS)
 * @param {string} params.entityType - Type of entity affected
 * @param {string} params.entityId - ID of affected entity
 * @param {Object} params.metadata - Additional context
 * @param {string} params.ipAddress - IP address of user
 */
async function logAudit({
  userId,
  action,
  entityType = null,
  entityId = null,
  metadata = {},
  ipAddress = null,
}) {
  try {
    // Don't fail the main operation if audit logging fails
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      ip_address: ipAddress,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Log the error but don't throw
    console.error('Audit logging failed:', error);
  }
}

/**
 * Express middleware to automatically log requests
 * Use on sensitive routes
 */
function auditMiddleware(action) {
  return (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);
    
    // Override res.json to log after response
    res.json = function(body) {
      // Only log successful operations
      if (res.statusCode < 400) {
        logAudit({
          userId: req.user?.id,
          action,
          metadata: {
            method: req.method,
            path: req.path,
            params: req.params,
            // Don't log sensitive body data
          },
          ipAddress: req.ip || req.connection.remoteAddress,
        }).catch(() => {}); // Silently fail
      }
      
      return originalJson(body);
    };
    
    next();
  };
}

/**
 * Log financial transaction
 */
async function logFinancialTransaction({
  userId,
  action,
  amount,
  currency,
  orderId,
  metadata = {},
  ipAddress = null,
}) {
  return logAudit({
    userId,
    action,
    entityType: 'order',
    entityId: orderId,
    metadata: {
      ...metadata,
      amount,
      currency,
    },
    ipAddress,
  });
}

/**
 * Log admin action
 */
async function logAdminAction({
  adminId,
  action,
  targetUserId = null,
  entityType,
  entityId,
  metadata = {},
  ipAddress = null,
}) {
  return logAudit({
    userId: adminId,
    action,
    entityType,
    entityId,
    metadata: {
      ...metadata,
      targetUserId,
      isAdminAction: true,
    },
    ipAddress,
  });
}

module.exports = {
  AUDIT_ACTIONS,
  logAudit,
  auditMiddleware,
  logFinancialTransaction,
  logAdminAction,
};
