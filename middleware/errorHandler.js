import { logError, logValidation } from '../logger.js';
import { MESSAGES } from '../config/index.js';
import { HTTP_STATUS } from '../config/index.js';

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, type = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400
 */
export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Unauthorized Error - 401
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Database/Mongoose Error - 500
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database error occurred') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

/**
 * Duplicate Key Error - 400
 */
export class DuplicateError extends AppError {
  constructor(field = 'field') {
    super(`${field} already exists`, 400, 'DUPLICATE_ERROR');
  }
}

/**
 * Cast Error (Invalid ObjectId) - 400
 */
export class CastError extends AppError {
  constructor(field = 'ID') {
    super(`Invalid ${field}`, 400, 'CAST_ERROR');
  }
}

/**
 * Central Error Handler Middleware
 * Catches all errors from routes and sends standardized responses
 * Handles Express, Mongoose, and custom errors
 */
export function errorHandler(err, req, res, next) {
  // Default error values
  let error = {
    statusCode: err.statusCode || 500,
    message: err.message || 'Internal Server Error',
    type: err.type || 'INTERNAL_ERROR'
  };

  // Log error with user context
  const userInfo = req.user ? `${req.user.username}` : 'unknown';
  logError(error.type, error.message, `User: ${userInfo}`);

  // ==========================================
  // MONGOOSE VALIDATION ERRORS
  // ==========================================
  
  // Schema validation errors (required fields, enum values, etc.)
  if (err.name === 'ValidationError') {
    const fields = Object.keys(err.errors);
    const messages = Object.entries(err.errors)
      .map(([field, error]) => {
        // Extract custom validation message if exists
        if (error.message) return error.message;
        switch (error.kind) {
          case 'required':
            return `${field} is required`;
          case 'enum':
            return `${field} must be one of: ${error.enumValues?.join(', ')}`;
          case 'minlength':
            return `${field} must be at least ${error.minlength} characters`;
          case 'maxlength':
            return `${field} must not exceed ${error.maxlength} characters`;
          case 'min':
            return `${field} must be at least ${error.min}`;
          case 'max':
            return `${field} must not exceed ${error.max}`;
          case 'regex':
            return `${field} format is invalid`;
          default:
            return error.message || `${field} validation failed`;
        }
      })
      .join('; ');

    // Log validation error
    logValidation('MONGOOSE_VALIDATION', `Fields: ${fields.join(', ')}`, { 
      user: userInfo,
      errors: err.errors 
    });

    error = {
      statusCode: 400,
      message: messages,
      type: 'VALIDATION_ERROR',
      fields: err.errors
    };
  }

  // Duplicate key error (unique constraint violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = {
      statusCode: 400,
      message: `${field} "${value}" already exists`,
      type: 'DUPLICATE_ERROR',
      field: field
    };
  }

  // CastError - invalid MongoDB ObjectId or type conversion error
  if (err.name === 'CastError') {
    error = {
      statusCode: 400,
      message: `Invalid ${err.kind}: ${err.value}`,
      type: 'CAST_ERROR'
    };
  }

  // ==========================================
  // JWT & AUTHENTICATION ERRORS
  // ==========================================
  
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: MESSAGES.AUTH.INVALID_TOKEN,
      type: 'AUTH_ERROR'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: MESSAGES.AUTH.SESSION_EXPIRED,
      type: 'TOKEN_EXPIRED'
    };
  }


  if (err.name === 'MongoNetworkError') {
    error = {
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      message: MESSAGES.ERROR.DATABASE_ERROR || 'Database connection error',
      type: 'DATABASE_ERROR'
    };
  }

  // ==========================================
  // RESPONSE HANDLING
  // ==========================================
  
  // Always set error message in session
  req.session.failMessage = error.message;
  
  // Get the page to redirect to (referer or default dashboard)
  const referer = req.get('referer') || '/dashboard';
  
  // Redirect to previous page with error message
  return res.redirect(referer);
}

/**
 * Async error wrapper for controllers
 * Eliminates try-catch boilerplate
 */
export function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
