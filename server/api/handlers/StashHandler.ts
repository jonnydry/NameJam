/**
 * Stash Handler
 * Handles user stash management (save, retrieve, delete names)
 */

import type { Request, Response } from "express";
import { secureLog } from "../../utils/secureLogger";
import { storage } from "../../storage";

export class StashHandler {
  async handleGetStash(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      const stash = await storage.getUserStash(userId);
      
      res.json({ stash });
    } catch (error) {
      secureLog.error("Error fetching stash:", error);
      res.status(500).json({ message: "Failed to fetch stash" });
    }
  }

  async handleAddToStash(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      const { name, type, rating } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ error: "Name and type are required" });
      }

      const stashItem = await storage.addToStash(userId, {
        name,
        type,
        rating: rating || 0
      });
      
      res.json({ 
        success: true, 
        item: stashItem,
        message: "Added to stash successfully" 
      });
    } catch (error) {
      secureLog.error("Error adding to stash:", error);
      res.status(500).json({ message: "Failed to add to stash" });
    }
  }

  async handleRemoveFromStash(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      const { itemId } = req.params;
      
      if (!itemId) {
        return res.status(400).json({ error: "Item ID is required" });
      }

      await storage.removeFromStash(userId, itemId);
      
      res.json({ 
        success: true, 
        message: "Removed from stash successfully" 
      });
    } catch (error) {
      secureLog.error("Error removing from stash:", error);
      res.status(500).json({ message: "Failed to remove from stash" });
    }
  }

  async handleClearStash(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      await storage.clearUserStash(userId);
      
      res.json({ 
        success: true, 
        message: "Stash cleared successfully" 
      });
    } catch (error) {
      secureLog.error("Error clearing stash:", error);
      res.status(500).json({ message: "Failed to clear stash" });
    }
  }

  async handleCheckStash(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      const { name, type } = req.query;
      
      if (!name || !type) {
        return res.status(400).json({ error: "Name and type are required" });
      }

      const isInStash = await storage.isInStash(userId, name as string, type as string);
      
      res.json({ 
        isInStash,
        name,
        type
      });
    } catch (error) {
      secureLog.error("Error checking stash:", error);
      res.status(500).json({ message: "Failed to check stash" });
    }
  }

  async handleUpdateStashRating(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      const { itemId } = req.params;
      const { rating } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ 
          error: "Rating must be between 1 and 5" 
        });
      }
      
      const success = await this.storage.updateStashRating(userId, itemId, rating);
      if (!success) {
        return res.status(404).json({ 
          error: "Item not found" 
        });
      }
      
      res.json({ 
        success: true,
        message: "Rating updated successfully"
      });
    } catch (error) {
      secureLog.error("Error updating stash rating:", error);
      res.status(500).json({ 
        error: "Failed to update rating" 
      });
    }
  }
}