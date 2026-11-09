// Input validation helpers shared by the services.
// AI-generated (Claude Code) - see docs/AI_USAGE.md
import { badRequest } from './errors.js';

export function requireString(value, label, { max = 200 } = {}) {
  if (typeof value !== 'string' || value.trim() === '') throw badRequest(`${label} is required.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw badRequest(`${label} must be ${max} characters or fewer.`);
  return trimmed;
}

export function requireInt(value, label, { min = 0, max = 100000 } = {}) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (!Number.isInteger(n)) throw badRequest(`${label} must be a whole number.`);
  if (n < min || n > max) throw badRequest(`${label} must be between ${min} and ${max}.`);
  return n;
}

export function optionalInt(value, label, opts) {
  if (value === undefined || value === null || value === '') return null;
  return requireInt(value, label, opts);
}

export function requireId(value, label = 'ID') {
  return requireInt(value, label, { min: 1, max: Number.MAX_SAFE_INTEGER });
}
