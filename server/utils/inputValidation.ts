/**
 * Input validation utilities for production security
 */

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove dangerous characters and patterns
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 1000); // Limit length
}

// Validate name generation input
export function validateNameRequest(type: string, wordCount: number, count: number): boolean {
  // Validate type
  if (!['band', 'song'].includes(type)) return false;
  
  // Validate word count
  if (!Number.isInteger(wordCount) || wordCount < 1 || wordCount > 10) return false;
  
  // Validate count
  if (!Number.isInteger(count) || count < 1 || count > 10) return false;
  
  return true;
}

// Validate mood and genre inputs
export function validateMoodGenre(mood?: string, genre?: string): boolean {
  const validMoods = ['dark', 'bright', 'mysterious', 'energetic', 'melancholy', 
    'ethereal', 'aggressive', 'peaceful', 'nostalgic', 'futuristic', 'romantic', 'epic'];
  
  const validGenres = ['rock', 'metal', 'jazz', 'electronic', 'folk', 'classical', 
    'hip-hop', 'country', 'blues', 'reggae', 'punk', 'indie', 'pop', 'alternative'];
  
  if (mood && !validMoods.includes(mood)) return false;
  if (genre && !validGenres.includes(genre)) return false;
  
  return true;
}

// Validate search query
export function validateSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  
  // Sanitize and limit length
  return sanitizeInput(query).slice(0, 100);
}

// Validate database ID
export function validateId(id: any): boolean {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id);
}