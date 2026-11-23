const cors = require('cors');
const rateLimit = require('express-rate-limit');

// ── CORS ─────────────────────────────────────────────────────────────────────
// Only these websites (origins) may call the API from a browser.
// ALLOWED_ORIGINS (env, optional): comma-separated list, e.g.
//   ALLOWED_ORIGINS=https://skill-swap-6.vercel.app,http://localhost:5173
// Falls back to CLIENT_URL, then to the live site + local Vite dev server.
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.CLIENT_URL ||
  'https://skill-swap-6.vercel.app,http://localhost:5173'
)
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsMiddleware = cors({
  origin(origin, callback) {
    // No Origin header = not a browser cross-site call (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false); // browser blocks the response (no CORS headers sent)
  },
});

// ── Rate limiting ────────────────────────────────────────────────────────────
// Login / register: stops password guessing and spam sign-ups.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,                // 10 attempts per IP per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many login/register attempts. Please try again in 15 minutes.' },
});

// Whole API: a generous cap so normal use (incl. 5s message polling) is never hit.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000,              // ~1 request/sec average per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down and try again shortly.' },
});

module.exports = { corsMiddleware, authLimiter, apiLimiter, allowedOrigins };
