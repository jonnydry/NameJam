import { Request, Response, NextFunction } from 'express';

// Middleware to add caching headers for static assets
export function cacheHeaders(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  
  // Skip API routes
  if (path.startsWith('/api/')) {
    return next();
  }
  
  // Set cache headers based on file type
  if (path.match(/\.(js|css)$/) && path.includes('.')) {
    // Immutable caching for hashed assets
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (path.match(/\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|otf)$/)) {
    // Long cache for images and fonts
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  } else if (path.match(/\.(json)$/)) {
    // Short cache for JSON
    res.setHeader('Cache-Control', 'public, max-age=3600');
  } else if (path === '/' || path.endsWith('.html')) {
    // No cache for HTML
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Add performance headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  next();
}