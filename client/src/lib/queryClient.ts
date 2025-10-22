import { QueryClient, QueryFunction } from "@tanstack/react-query";

import { getUserFriendlyError } from '@/utils/errorMessages';
import { gracefulDegradationService } from '@/services/gracefulDegradationService';
import { errorTrackingService } from '@/services/errorTrackingService';
import { ErrorSeverity, ErrorHandler } from '@shared/errorSchemas';

// CSRF token management
let csrfToken: string | null = null;

export async function fetchCSRFToken(): Promise<string> {
  if (!csrfToken) {
    try {
      const res = await fetch('/api/csrf-token', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        csrfToken = data.csrfToken;
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
    }
  }
  return csrfToken || '';
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let errorData: any = null;
    try {
      errorData = JSON.parse(text);
    } catch {}
    
    const userMessage = errorData?.suggestion || getUserFriendlyError({ status: res.status });
    throw new Error(userMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const startTime = Date.now();
  
  // Determine service name for degradation tracking
  const serviceName = getServiceNameFromUrl(url);
  
  const executeRequest = async (): Promise<Response> => {
    const headers: Record<string, string> = {};
    
    if (data) {
      headers["Content-Type"] = "application/json";
    }
    
    // Add CSRF token for state-changing requests
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const token = await fetchCSRFToken();
      if (token) {
        headers["X-CSRF-Token"] = token;
      }
    }
    
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  };
  
  // Fallback operation for critical services
  const fallbackOperation = serviceName ? getFallbackOperation(serviceName, url) : undefined;
  
  try {
    // BYPASS degradation service for name generation - it's working perfectly
    if (serviceName === 'name-generation') {
      return await executeRequest();
    }
    
    if (serviceName) {
      const result = await gracefulDegradationService.executeWithDegradation(
        serviceName,
        executeRequest,
        fallbackOperation
      );
      
      if (result.degraded && result.message) {
        // Store degradation info for UI display
        gracefulDegradationService.setFallbackState(`ui_message_${serviceName}`, result.message);
      }
      
      if (!result.data) {
        throw new Error(result.message || 'Service unavailable');
      }
      
      return result.data;
    } else {
      return await executeRequest();
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Track performance issues
    errorTrackingService.trackPerformance(`${method} ${url}`, duration);
    
    // Track the error
    errorTrackingService.trackError(
      error,
      { 
        method, 
        url, 
        duration,
        serviceName,
        hasData: !!data 
      },
      ErrorHandler.getErrorSeverity(error)
    );
    
    // Network errors or other fetch failures
    if (error.message === 'Failed to fetch') {
      throw new Error('Connection error. Please check your internet and try again.');
    }
    throw error;
  }
}

function getServiceNameFromUrl(url: string): string | null {
  if (url.includes('/api/generate-names')) return 'name-generation';
  if (url.includes('/api/verify-name')) return 'name-verification';
  if (url.includes('/api/generate-band-bio')) return 'name-generation';
  if (url.includes('/api/generate-lyric-starter')) return 'name-generation';
  return null;
}

function getFallbackOperation(serviceName: string, url: string): (() => Promise<Response>) | undefined {
  // TEMPORARILY DISABLED: Backend is working perfectly, no fallback needed
  // Define fallback operations for critical services
  if (serviceName === 'name-generation') {
    // Return undefined to disable fallback and force real API calls
    return undefined;
  }
  
  return undefined;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
