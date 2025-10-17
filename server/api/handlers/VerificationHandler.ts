/**
 * Verification Handler
 * Handles name verification requests
 */

import type { Request, Response } from "express";
import { z } from "zod";
import { secureLog } from "../../utils/secureLogger";
import { InputSanitizer } from "../../utils/inputSanitizer";
import { parallelVerificationService } from "../../services/parallelVerification";

const verifyNameSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['band', 'song'])
});

export class VerificationHandler {
  async handleVerifyName(req: Request, res: Response): Promise<void> {
    try {
      // Sanitize inputs
      const sanitizedBody = {
        name: InputSanitizer.sanitizeTextInput(req.body.name),
        type: req.body.type
      };
      
      const request = verifyNameSchema.parse(sanitizedBody);
      
      // Verify the name
      const verification = await parallelVerificationService.verifyNamesInParallel([{
        name: request.name,
        type: request.type
      }]);
      
      if (verification.length === 0) {
        return res.status(500).json({ 
          error: "Verification failed",
          suggestion: "Please try again later."
        });
      }
      
      const result = verification[0];
      
      res.json({
        name: request.name,
        type: request.type,
        verification: result
      });
      
    } catch (error) {
      secureLog.error("Error verifying name:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid request parameters", 
          details: error.errors 
        });
      } else {
        res.status(500).json({ 
          error: "Failed to verify name",
          suggestion: "The verification service may be temporarily unavailable. Please try again later."
        });
      }
    }
  }
}
