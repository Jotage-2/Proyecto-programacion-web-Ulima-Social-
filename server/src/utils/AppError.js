/**
 * Representa errores controlados con un mensaje y un código HTTP.
 */

export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}
