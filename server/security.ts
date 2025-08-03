import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import { body, validationResult, param, query } from 'express-validator';
import type { Request, Response, NextFunction, Express } from 'express';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';
import { DistributedRateLimiter } from './utils/sessionSecretRotation';
import { InputSanitizer } from './utils/inputSanitizer';
// Server-side HTML sanitization (simplified approach for security)
const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  // Remove all HTML tags and dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
    .trim();
};

// Encryption key from environment or generate one
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'name-jam-default-key-2025';

/**
 * API Rate Limiting Configuration
 */
export const createRateLimiters = () => {
  // General API rate limiter - 100 requests per 15 minutes
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks and static assets
    skip: (req) => {
      return req.path.startsWith('/api/health') || 
             req.path.startsWith('/assets/') ||
             req.path.startsWith('/favicon');
    }
  });

  // Distributed rate limiter for better protection
  const distributedLimiter = new DistributedRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
      // Combine multiple factors for better distributed protection
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const fingerprint = req.headers['x-fingerprint'] || '';
      return `${ip}-${userAgent}-${fingerprint}`;
    }
  });

  // Strict limiter for generation endpoints - 30 requests per 10 minutes
  const generationLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30,
    message: {
      error: 'Generation rate limit exceeded. Please wait before making more requests.',
      retryAfter: '10 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Auth endpoint limiter - 10 attempts per 15 minutes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  return {
    general: generalLimiter,
    generation: generationLimiter,
    auth: authLimiter
  };
};

/**
 * CORS Configuration
 */
export const createCorsOptions = () => {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [
        // Production domains - will be updated when deployed
        /\.replit\.app$/,
        /\.repl\.co$/,
      ]
    : [
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        /\.replit\.dev$/,
      ];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        }
        return allowedOrigin.test(origin);
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ]
  });
};

/**
 * Helmet Security Configuration
 */
export const createHelmetOptions = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [
          "'self'", 
          "https://api.x.ai", // XAI API
          "https://api.spotify.com", // Spotify API
          "https://api.datamuse.com", // Datamuse API
          "https://ws.audioscrobbler.com", // Last.fm API
          "https://musicbrainz.org", // MusicBrainz API
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameAncestors: ["'self'", "https://*.replit.dev", "https://*.replit.com"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    frameguard: {
      action: 'sameorigin'
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });
};

/**
 * Input Sanitization Utilities
 */
export const sanitizeInput = {
  // Sanitize HTML content to prevent XSS
  html: (input: string): string => {
    return sanitizeHtml(input);
  },

  // Sanitize and normalize text input
  text: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 500); // Limit length
  },

  // Sanitize name inputs (band/song names)
  name: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 200); // Limit length for names
  },

  // Sanitize enum values
  enum: (input: string, allowedValues: string[]): string => {
    if (!input || typeof input !== 'string') return '';
    const sanitized = input.trim().toLowerCase();
    return allowedValues.includes(sanitized) ? sanitized : '';
  }
};

/**
 * Express Validator Rules
 */
export const validationRules = {
  // Name generation request validation
  generateNames: [
    body('type').isIn(['band', 'song']).withMessage('Type must be band or song'),
    body('wordCount').isInt({ min: 1, max: 6 }).withMessage('Word count must be 1-6'),
    body('count').optional().isInt({ min: 1, max: 10 }).withMessage('Count must be 1-10'),
    body('mood').optional().isIn([
      'dark', 'bright', 'mysterious', 'energetic', 'melancholy', 'ethereal',
      'aggressive', 'peaceful', 'nostalgic', 'futuristic', 'romantic', 'epic'
    ]).withMessage('Invalid mood'),
    body('genre').optional().isIn([
      'rock', 'metal', 'jazz', 'electronic', 'folk', 'classical', 'hip-hop',
      'country', 'blues', 'reggae', 'punk', 'indie', 'pop', 'alternative'
    ]).withMessage('Invalid genre'),
  ],

  // Name verification validation
  verifyName: [
    body('name').isLength({ min: 1, max: 200 }).withMessage('Name required (1-200 chars)'),
    body('type').isIn(['band', 'song']).withMessage('Type must be band or song'),
  ],

  // Set list generation validation
  generateSetlist: [
    body('songCount').isIn(['8', '16']).withMessage('Song count must be 8 or 16'),
    body('mood').optional().isLength({ min: 1, max: 50 }).withMessage('Mood too long'),
    body('genre').optional().isLength({ min: 1, max: 50 }).withMessage('Genre too long'),
  ],

  // Band bio generation validation
  generateBandBio: [
    body('bandName').isLength({ min: 1, max: 200 }).withMessage('Band name required (1-200 chars)'),
    body('genre').optional().isLength({ min: 1, max: 50 }).withMessage('Genre too long'),
    body('mood').optional().isLength({ min: 1, max: 50 }).withMessage('Mood too long'),
  ],

  // Lyric starter validation
  generateLyricStarter: [
    body('genre').optional().isLength({ min: 1, max: 50 }).withMessage('Genre too long'),
    body('songSection').optional().isIn(['verse', 'chorus', 'bridge', 'pre-chorus', 'outro'])
      .withMessage('Invalid song section'),
  ]
};

/**
 * Validation Error Handler Middleware
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Input Sanitization Middleware
 */
export const sanitizeRequestData = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        switch (key) {
          case 'name':
          case 'bandName':
            req.body[key] = sanitizeInput.name(value);
            break;
          case 'type':
            req.body[key] = sanitizeInput.enum(value, ['band', 'song']);
            break;
          case 'mood':
            req.body[key] = sanitizeInput.enum(value, [
              'dark', 'bright', 'mysterious', 'energetic', 'melancholy', 'ethereal',
              'aggressive', 'peaceful', 'nostalgic', 'futuristic', 'romantic', 'epic'
            ]);
            break;
          case 'genre':
            req.body[key] = sanitizeInput.enum(value, [
              'rock', 'metal', 'jazz', 'electronic', 'folk', 'classical', 'hip-hop',
              'country', 'blues', 'reggae', 'punk', 'indie', 'pop', 'alternative'
            ]);
            break;
          case 'songSection':
            req.body[key] = sanitizeInput.enum(value, ['verse', 'chorus', 'bridge', 'pre-chorus', 'outro']);
            break;
          default:
            req.body[key] = sanitizeInput.text(value);
        }
      }
    }
  }

  // Sanitize query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = sanitizeInput.text(value);
      }
    }
  }

  next();
};

/**
 * Data Encryption Utilities
 */
export const encryption = {
  // Encrypt sensitive data
  encrypt: (text: string): string => {
    if (!text) return '';
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  },

  // Decrypt sensitive data
  decrypt: (encryptedText: string): string => {
    if (!encryptedText) return '';
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  },

  // Hash passwords and sensitive data
  hash: async (data: string): Promise<string> => {
    const saltRounds = 12;
    return await bcrypt.hash(data, saltRounds);
  },

  // Verify hashed data
  verify: async (data: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(data, hash);
  }
};

/**
 * Security Headers Middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS for HTTPS (will be handled by Replit in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Additional security headers
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  next();
};

/**
 * Setup Security Middleware for Express App
 */
export const setupSecurity = (app: Express) => {
  const rateLimiters = createRateLimiters();
  
  // Apply security middleware in order
  app.use(createHelmetOptions());
  app.use(createCorsOptions());
  app.use(securityHeaders);
  app.use(rateLimiters.general);
  app.use(sanitizeRequestData);
  
  return rateLimiters;
};