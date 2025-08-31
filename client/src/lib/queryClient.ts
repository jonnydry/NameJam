import { QueryClient, QueryFunction } from "@tanstack/react-query";

import { getUserFriendlyError } from '@/utils/errorMessages';

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
  try {
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
  } catch (error: any) {
    // Network errors or other fetch failures
    if (error.message === 'Failed to fetch') {
      throw new Error('Connection error. Please check your internet and try again.');
    }
    throw error;
  }
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
