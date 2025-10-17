/**
 * User Handler
 * Handles user-related requests
 */

import type { Request, Response } from "express";
import { secureLog } from "../../utils/secureLogger";
import { storage } from "../../storage";

export class UserHandler {
  async handleGetUser(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      secureLog.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  }

  async handleGetRecentNames(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      const type = req.query.type as string;
      const limit = parseInt(req.query.limit as string) || 20;

      const names = await storage.getRecentGeneratedNames(userId, type, limit);
      
      res.json(names);
    } catch (error) {
      secureLog.error("Error fetching recent names:", error);
      res.status(500).json({ 
        error: "Failed to fetch recent names",
        suggestion: "The database service may be temporarily unavailable. Please refresh the page."
      });
    }
  }
}
