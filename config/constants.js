/**
 * Application-wide constants
 * Includes JWT configuration, HTTP status codes, and other magic numbers
 */

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  
  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  
  // Server Errors
  INTERNAL_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503
};

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
  // Token expiration times
  ACCESS_TOKEN_EXPIRY: '90m',
  REFRESH_TOKEN_EXPIRY: '20m',
  
  // Cookie settings
  COOKIE_MAX_AGE: 20 * 60 * 1000, // 20 minutes in milliseconds
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

/**
 * Cookie Configuration
 */
export const COOKIE_CONFIG = {
  TOKEN_NAME: 'token',
  OPTIONS: {
    httpOnly: true,
    sameSite: 'lax'
    // secure: set dynamically based on SECURE_MODE
  }
};

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};

/**
 * File Upload Configuration
 */
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword']
};

/**
 * Validation Constants
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PERCENTAGE_SUM_REQUIRED: 100
};

/**
 * Time Constants (in milliseconds)
 */
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
};

/**
 * Database Operation Types (for logging)
 */
export const DB_OPERATIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  FIND: 'FIND',
  COUNT: 'COUNT'
};


