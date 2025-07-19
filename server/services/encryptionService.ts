import { encryption } from '../security';

/**
 * Service for handling sensitive data encryption
 * Encrypts API keys, tokens, and other sensitive information
 */
export class EncryptionService {
  /**
   * Encrypt API keys and tokens before storing
   */
  static encryptApiKey(apiKey: string): string {
    if (!apiKey) return '';
    return encryption.encrypt(apiKey);
  }

  /**
   * Decrypt API keys and tokens when needed
   */
  static decryptApiKey(encryptedKey: string): string {
    if (!encryptedKey) return '';
    return encryption.decrypt(encryptedKey);
  }

  /**
   * Hash sensitive user data for storage
   */
  static async hashSensitiveData(data: string): Promise<string> {
    return await encryption.hash(data);
  }

  /**
   * Verify hashed sensitive data
   */
  static async verifySensitiveData(data: string, hash: string): Promise<boolean> {
    return await encryption.verify(data, hash);
  }

  /**
   * Sanitize user inputs before processing
   */
  static sanitizeUserInput(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
      .substring(0, 1000); // Limit length
  }
}