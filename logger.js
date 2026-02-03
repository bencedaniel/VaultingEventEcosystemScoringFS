import { createLogger, format, transports, addColors } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Winston Logger Configuration
 * Structured logging with 8 levels for complete application tracking
 */

// Custom colors for log levels
addColors({
  db: 'magenta',         // Database operations
  operation: 'cyan',     // User operations
  auth: 'yellow',        // Authentication events
  validation: 'blue',    // Validation errors
  error: 'red',          // Error events
  warn: 'red bold',      // Warnings
  info: 'green',         // Info messages
  debug: 'gray'          // Debug info
});

export const logger = createLogger({
  levels: {
    db: 0,          // Database: CREATE, READ, UPDATE, DELETE
    operation: 1,   // Operations: user-initiated actions
    auth: 2,        // Auth: login, logout, token events
    validation: 3,  // Validation: field validation errors
    error: 4,       // Errors: application errors
    warn: 5,        // Warnings: potential issues
    info: 6,        // Info: general information
    debug: 7        // Debug: development information
  },
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.colorize({ all: true }),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    // Console output for development
    new transports.Console(),
    
    // File transports for production/archiving
    new transports.File({
      filename: path.join(__dirname, 'logs', 'error.log'),
      level: 'error',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json()
      )
    }),
    new transports.File({
      filename: path.join(__dirname, 'logs', 'combined.log'),
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

/**
 * Helper functions for structured logging
 * Use these for consistent log formatting across the application
 */

/**
 * Log database operations (CREATE, READ, UPDATE, DELETE)
 * @param {string} action - CREATE, READ, UPDATE, DELETE
 * @param {string} entity - Entity type (Card, Permission, User, etc.)
 * @param {string} entityId - Entity name or ID
 * @param {object} metadata - Optional: { fieldCount: 3, status: 'success' }
 */
export function logDb(action, entity, entityId, metadata = {}) {
  const metaStr = Object.keys(metadata).length > 0 ? ` | ${JSON.stringify(metadata)}` : '';
  logger.db(`[${action}] ${entity} (${entityId})${metaStr}`);
}

/**
 * Log user-initiated operations
 * @param {string} operationType - CARD_CREATE, USER_DELETE, PERMISSION_UPDATE, etc.
 * @param {string} details - Operation details
 * @param {string} username - User who performed action
 * @param {number} httpStatus - HTTP response status (optional)
 */
export function logOperation(operationType, details, username, httpStatus = null) {
  const statusStr = httpStatus ? ` | HTTP: ${httpStatus}` : '';
  logger.operation(`[${operationType}] ${details} by ${username}${statusStr}`);
}

/**
 * Log authentication events
 * @param {string} eventType - LOGIN, LOGOUT, TOKEN_EXPIRED, TOKEN_REFRESHED, etc.
 * @param {string} username - Username
 * @param {boolean} success - Operation success
 * @param {string} reason - Reason for failure (optional): INVALID_CREDENTIALS, SESSION_EXPIRED, etc.
 */
export function logAuth(eventType, username, success, reason = '') {
  const result = success ? '✓' : '✗';
  const reasonStr = reason ? ` | ${reason}` : '';
  logger.auth(`[${eventType}] ${result} ${username}${reasonStr}`);
}

/**
 * Log validation errors
 * @param {string} field - Field name (username, email, etc.)
 * @param {string} rule - Validation rule failed (MIN_LENGTH:3, INVALID_FORMAT, etc.)
 * @param {string} username - User who triggered validation (optional)
 */
export function logValidation(field, rule, username = '') {
  const userStr = username ? ` | by ${username}` : '';
  logger.validation(`Field: ${field} | Rule: ${rule}${userStr}`);
}

/**
 * Log errors with context
 * @param {string} errorType - ERROR_TYPE_NAME
 * @param {string} message - Error message
 * @param {string} context - Additional context (action, user, etc.)
 * @param {object} metadata - Additional metadata
 */
export function logError(errorType, message, context = '', metadata = {}) {
  const contextStr = context ? ` | Context: ${context}` : '';
  const metaStr = Object.keys(metadata).length > 0 ? ` | ${JSON.stringify(metadata)}` : '';
  logger.error(`[${errorType}] ${message}${contextStr}${metaStr}`);
}

/**
 * Log warnings
 * @param {string} warningType - WARNING_TYPE_NAME
 * @param {string} message - Warning message
 * @param {string} context - Additional context (optional)
 */
export function logWarn(warningType, message, context = '') {
  const contextStr = context ? ` | ${context}` : '';
  logger.warn(`[${warningType}] ${message}${contextStr}`);
}

/**
 * Log info messages
 * @param {string} message - Info message
 */
export function logInfo(message) {
  logger.info(message);
}

/**
 * Log debug information
 * @param {string} context - Debug context
 * @param {object} data - Data to debug (optional)
 */
export function logDebug(context, data = null) {
  const dataStr = data ? ` | ${JSON.stringify(data, null, 2)}` : '';
  logger.debug(`[DEBUG] ${context}${dataStr}`);
}
