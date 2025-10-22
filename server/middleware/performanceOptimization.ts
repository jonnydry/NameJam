import type { Request, Response, NextFunction } from 'express';

// Response compression middleware (simplified to fix header issues)
export const compressionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip compression for now to avoid header conflicts
  next();
};

// Request timeout middleware
export const timeoutMiddleware = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let timedOut = false;
    
    const timeout = setTimeout(() => {
      if (!res.headersSent && !timedOut) {
        timedOut = true;
        res.status(408).json({ 
          error: 'Request timeout',
          suggestion: 'The request took too long to process. Please try again with simpler settings.'
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeout);
      timedOut = true;
    });
    
    res.on('close', () => {
      clearTimeout(timeout);
      timedOut = true;
    });
    
    // Store timeout state for route handlers to check
    (req as any).timedOut = () => timedOut;
    
    next();
  };
};

// Response time header middleware
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only set header if headers haven't been sent
    if (!res.headersSent) {
      try {
        res.setHeader('X-Response-Time', `${duration}ms`);
      } catch (error) {
        // Silently ignore header setting errors
      }
    }
  });
  
  next();
};

// Memory usage monitoring middleware
export const memoryMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const memUsage = process.memoryUsage();
  
  // Log memory usage for monitoring (can be sent to analytics)
  if (memUsage.heapUsed > 100 * 1024 * 1024) { // > 100MB
    console.warn(`High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  }
  
  next();
};