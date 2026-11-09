// Typed application errors. The error handler turns these into JSON responses.
// AI-generated (Claude Code) - see docs/AI_USAGE.md

export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message) => new AppError(400, 'bad_request', message);
export const unauthorized = (message = 'Please sign in.') => new AppError(401, 'unauthorized', message);
export const forbidden = (message = 'You do not have access to this feature.') => new AppError(403, 'forbidden', message);
export const notFound = (message = 'Not found.') => new AppError(404, 'not_found', message);
export const conflict = (message) => new AppError(409, 'conflict', message);
export const tooManyRequests = (message) => new AppError(429, 'too_many_requests', message);
