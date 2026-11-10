import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import {
  hashPassword,
  verifyPassword,
  sha256,
  DUMMY_HASH
} from './passwords.js';

const SESSION_LENGTH = 7 * 24 * 60 * 60 * 1000;

const LOGIN_WINDOW = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const loginAttempts = new Map();

function checkLoginLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record && now - record.startedAt < LOGIN_WINDOW) {
    if (record.count >= MAX_LOGIN_ATTEMPTS) {
      return res.status(429).json({
        error: { message: 'Too many login attempts. Try again in 15 minutes.' }
      });
    }
  } else {
    loginAttempts.set(ip, { count: 0, startedAt: now });
  }

  next();
}


export function authRoutes(db) {
  const router = Router();

  function startSession(res, userId) {
    const token = randomBytes(32).toString('hex');
    const expires = Date.now() + SESSION_LENGTH;

    db.prepare(
      'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
    ).run(sha256(token), userId, expires);

    res.cookie('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_LENGTH,
      path: '/'
    });
  }

  router.post('/register', (req, res) => {
    const { name, email, password } = req.body ?? {};

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof password !== 'string' || password.length < 8
    ) {
      return res.status(400).json({
        error: { message: 'Enter a name, email, and password of at least 8 characters.' }
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        error: { message: 'Enter a valid email address.' }
      });
    }

    if (name.trim().length > 200 || cleanEmail.length > 254 || password.length > 1024) {
      return res.status(400).json({
        error: { message: 'One or more fields are too long.' }
      });
    }

    const existing = db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).get(cleanEmail);

    if (existing) {
      return res.status(409).json({
        error: { message: 'An account with this email already exists.' }
      });
    }

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, 'student', ?)
    `).run(
      name.trim(),
      cleanEmail,
      hashPassword(password),
      new Date().toISOString()
    );

    startSession(res, Number(result.lastInsertRowid));

    res.status(201).json({
      user: {
        id: Number(result.lastInsertRowid),
        name: name.trim(),
        email: cleanEmail,
        role: 'student'
      }
    });
  });

  router.post('/login', checkLoginLimit, (req, res) => {
    const { email, password } = req.body ?? {};

    if (typeof email !== 'string' || typeof password !== 'string' ||
        email.length > 254 || password.length > 1024) {
      return res.status(400).json({
        error: { message: 'Email and password are required.' }
      });
    }

    const user = db.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).get(email.trim().toLowerCase());

    const valid = verifyPassword(password, user?.password_hash ?? DUMMY_HASH);

    if (!user || !valid) {
      const ip = req.ip;
      const record = loginAttempts.get(ip);
      if (record) record.count++;

      return res.status(401).json({
        error: { message: 'Incorrect email or password.' }
      });
    }

    loginAttempts.delete(req.ip);
    startSession(res, user.id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });

  router.post('/logout', (req, res) => {
    const cookie = req.headers.cookie
      ?.split(';')
      .map(part => part.trim())
      .find(part => part.startsWith('session='));

    if (cookie) {
      const token = cookie.slice('session='.length);

      db.prepare(
        'DELETE FROM sessions WHERE token_hash = ?'
      ).run(sha256(token));
    }

    res.clearCookie('session', { path: '/' });
    res.status(204).end();
  });

  router.get('/me', (req, res) => {
    const cookie = req.headers.cookie
      ?.split(';')
      .map(part => part.trim())
      .find(part => part.startsWith('session='));

    if (!cookie) {
      return res.status(401).json({
        error: { message: 'Please sign in.' }
      });
    }

    const token = cookie.slice('session='.length);

    const user = db.prepare(`
      SELECT users.id, users.name, users.email, users.role
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > ?
    `).get(sha256(token), Date.now());

    if (!user) {
      return res.status(401).json({
        error: { message: 'Session expired or invalid.' }
      });
    }

    res.json({ user });
  });

  return router;
}
