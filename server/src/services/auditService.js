const AuditLog = require('../models/AuditLog');
const SecurityEvent = require('../models/SecurityEvent');

/**
 * Log an audit trail item securely
 */
const logAudit = async ({
  userId,
  userEmail,
  action,
  transactionId,
  result = 'SUCCESS',
  req,
  metadata = {},
}) => {
  try {
    const ipAddress = req ? req.ip || req.connection?.remoteAddress || '127.0.0.1' : '127.0.0.1';
    const userAgent = req ? req.headers['user-agent'] || 'Unknown' : 'System';

    // Sanitize metadata - never log passwords, tokens, or raw shares
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.shareData;
    delete sanitizedMetadata.rawBuffer;

    return await AuditLog.create({
      userId,
      userEmail,
      action,
      transactionId,
      result,
      ipAddress,
      userAgent,
      metadata: sanitizedMetadata,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};

/**
 * Log a security threat or anomalous event
 */
const logSecurityEvent = async ({
  eventType,
  severity = 'MEDIUM',
  userId,
  userEmail,
  transactionId,
  req,
  details = {},
}) => {
  try {
    const ipAddress = req ? req.ip || req.connection?.remoteAddress || '127.0.0.1' : '127.0.0.1';

    const sanitizedDetails = { ...details };
    delete sanitizedDetails.password;
    delete sanitizedDetails.token;
    delete sanitizedDetails.shareData;

    return await SecurityEvent.create({
      eventType,
      severity,
      userId,
      userEmail,
      transactionId,
      ipAddress,
      details: sanitizedDetails,
    });
  } catch (error) {
    console.error('Failed to log security event:', error.message);
  }
};

module.exports = {
  logAudit,
  logSecurityEvent,
};
