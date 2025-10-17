/**
 * Background Queue Service
 * Handles non-blocking database operations and other background tasks
 */

import { EventEmitter } from "events";
import { secureLog } from "../../utils/secureLogger";
import { storage } from "../../storage";

interface QueueItem {
  id: string;
  type: 'createGeneratedName' | 'createUserFeedback' | 'updateUserPreferences';
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

export class BackgroundQueue extends EventEmitter {
  private queue: QueueItem[] = [];
  private processing = false;
  private readonly MAX_RETRIES = 3;
  private readonly PROCESSING_INTERVAL = 100; // 100ms
  private readonly MAX_QUEUE_SIZE = 1000;
  private readonly ITEM_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    super();
    this.startProcessing();
    this.startCleanup();
  }

  private startProcessing(): void {
    if (this.processing) return;
    
    this.processing = true;
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.processing) {
      try {
        if (this.queue.length > 0) {
          const item = this.queue.shift();
          if (item) {
            await this.processItem(item);
          }
        } else {
          // No items to process, wait a bit
          await new Promise(resolve => setTimeout(resolve, this.PROCESSING_INTERVAL));
        }
      } catch (error) {
        secureLog.error('Background queue processing error:', error);
        await new Promise(resolve => setTimeout(resolve, this.PROCESSING_INTERVAL));
      }
    }
  }

  private async processItem(item: QueueItem): Promise<void> {
    try {
      switch (item.type) {
        case 'createGeneratedName':
          await storage.createGeneratedName(item.data);
          secureLog.debug(`Background queue: Created generated name: ${item.data.name}`);
          break;
        
        case 'createUserFeedback':
          await storage.createUserFeedback(item.data);
          secureLog.debug(`Background queue: Created user feedback for user: ${item.data.userId}`);
          break;
        
        case 'updateUserPreferences':
          await storage.updateUserPreferences(item.data.userId, item.data.preferences);
          secureLog.debug(`Background queue: Updated user preferences for user: ${item.data.userId}`);
          break;
        
        default:
          secureLog.warn(`Unknown queue item type: ${item.type}`);
      }

      this.emit('itemProcessed', { id: item.id, type: item.type, success: true });
    } catch (error) {
      secureLog.error(`Background queue: Failed to process item ${item.id}:`, error);
      
      // Retry logic
      if (item.retries < item.maxRetries) {
        item.retries++;
        this.queue.push(item); // Add back to queue for retry
        secureLog.debug(`Background queue: Retrying item ${item.id} (attempt ${item.retries}/${item.maxRetries})`);
      } else {
        secureLog.error(`Background queue: Item ${item.id} failed after ${item.maxRetries} retries`);
        this.emit('itemFailed', { id: item.id, type: item.type, error });
      }
    }
  }

  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const initialLength = this.queue.length;
      
      this.queue = this.queue.filter(item => {
        const age = now - item.timestamp;
        return age < this.ITEM_TTL;
      });
      
      const removedCount = initialLength - this.queue.length;
      if (removedCount > 0) {
        secureLog.debug(`Background queue: Cleaned up ${removedCount} expired items`);
      }
    }, 60 * 1000); // Cleanup every minute
  }

  // Public API methods
  enqueueCreateGeneratedName(data: any): void {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      secureLog.warn('Background queue: Queue is full, dropping createGeneratedName request');
      return;
    }

    const item: QueueItem = {
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'createGeneratedName',
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: this.MAX_RETRIES
    };

    this.queue.push(item);
    secureLog.debug(`Background queue: Enqueued createGeneratedName for: ${data.name}`);
  }

  enqueueCreateUserFeedback(data: any): void {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      secureLog.warn('Background queue: Queue is full, dropping createUserFeedback request');
      return;
    }

    const item: QueueItem = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'createUserFeedback',
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: this.MAX_RETRIES
    };

    this.queue.push(item);
    secureLog.debug(`Background queue: Enqueued createUserFeedback for user: ${data.userId}`);
  }

  enqueueUpdateUserPreferences(userId: string, preferences: any): void {
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      secureLog.warn('Background queue: Queue is full, dropping updateUserPreferences request');
      return;
    }

    const item: QueueItem = {
      id: `prefs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'updateUserPreferences',
      data: { userId, preferences },
      timestamp: Date.now(),
      retries: 0,
      maxRetries: this.MAX_RETRIES
    };

    this.queue.push(item);
    secureLog.debug(`Background queue: Enqueued updateUserPreferences for user: ${userId}`);
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      maxQueueSize: this.MAX_QUEUE_SIZE,
      maxRetries: this.MAX_RETRIES,
      itemTTL: this.ITEM_TTL
    };
  }

  stop(): void {
    this.processing = false;
    secureLog.info('Background queue: Stopped processing');
  }
}

// Singleton instance
export const backgroundQueue = new BackgroundQueue();
