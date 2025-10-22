/**
 * User-friendly error message utilities
 */

export function getUserFriendlyError(error: any): string {
  // HTTP status errors
  if (error.status === 429) {
    return 'You\'ve made too many requests. Please wait a moment before trying again.';
  }
  
  if (error.status === 503) {
    return 'The service is undergoing maintenance. Please try again later.';
  }
  
  if (error.status === 500) {
    return 'Something went wrong on our end. Please try again.';
  }
  
  if (error.status === 404) {
    return 'The requested resource was not found.';
  }
  
  if (error.status === 401) {
    return 'Please log in to continue.';
  }
  
  if (error.status === 403) {
    return 'You don\'t have permission to access this.';
  }
  
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.message?.includes('Failed to fetch')) {
    return 'Connection error. Please check your internet and try again.';
  }
  
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return 'The request took too long. Please try again.';
  }
  
  // Validation errors
  if (error.message?.includes('validation')) {
    return 'Please check your input and try again.';
  }
  
  // Database errors
  if (error.message?.includes('database')) {
    return 'We\'re having trouble saving your data. Please try again.';
  }
  
  // Default message
  return 'Something went wrong. Please try again or contact support if the problem persists.';
}