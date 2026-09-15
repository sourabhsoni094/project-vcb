/**
 * Centralized Error Handling Middleware
 * Guarantees standard structured JSON responses across all endpoints
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'SERVER_ERROR';

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    message = `Resource not found with specified identifier`;
    statusCode = 404;
    code = 'RESOURCE_NOT_FOUND';
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value entered for '${field}'. Please use another value.`;
    statusCode = 400;
    code = 'DUPLICATE_KEY';
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token';
    statusCode = 401;
    code = 'TOKEN_INVALID';
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Authentication token expired';
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
  }

  const response = {
    success: false,
    message,
    code,
  };

  // Only append debug stack in local development if not in production
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    response.debug = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
