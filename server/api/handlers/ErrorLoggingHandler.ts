/**
 * Error Logging Handler
 * Handles error logging and client error reporting
 */

import type { Request, Response } from "express";
import { secureLog } from "../../utils/secureLogger";
import { storage } from "../../storage";

export class ErrorLoggingHandler {
  async handleLogError(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      const { error, url, userId } = req.body;
      
      if (!error) {
        return res.status(400).json({ error: "Error details are required" });
      }

      await storage.createErrorLog({
        error: error.message || error,
        stack: error.stack || null,
        url: url || req.url,
        userId: userId || req.user?.claims?.sub || null,
        userAgent: req.headers['user-agent'] || null,
        timestamp: new Date()
      });
      
      res.json({ success: true });
    } catch (error) {
      secureLog.error('Error logging failed:', error);
      res.status(200).json({ success: false });
    }
  }

  async handleLogClientErrors(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      const { errors } = req.body;
      
      if (!Array.isArray(errors) || errors.length === 0) {
        return res.status(400).json({ error: "Errors array is required" });
      }

      // Process errors in parallel
      const errorPromises = errors.map(async (error: any) => {
        try {
          await storage.createErrorLog({
            error: error.message || error.error || 'Unknown error',
            stack: error.stack || null,
            url: error.url || req.url,
            userId: error.userId || req.user?.claims?.sub,
            userAgent: req.headers['user-agent'] || null,
            timestamp: new Date()
          });
        } catch (dbError) {
          secureLog.warn('Failed to store client error:', dbError);
        }
      });
      
      await Promise.allSettled(errorPromises);
      
      res.json({
        success: true,
        processed: errors.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      secureLog.error('Client error reporting failed:', error);
      res.status(200).json({ success: false });
    }
  }
}