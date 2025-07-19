import { toast } from "@/hooks/use-toast";

interface ApiErrorOptions {
  title?: string;
  description?: string;
  logToConsole?: boolean;
  showToast?: boolean;
}

export function handleApiError(
  error: unknown, 
  options: ApiErrorOptions = {}
): void {
  const {
    title = "An error occurred",
    description,
    logToConsole = true,
    showToast = true
  } = options;

  // Get error message
  let errorMessage = "An unexpected error occurred. Please try again.";
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message);
  }

  // Log to console if enabled
  if (logToConsole) {
    console.error(`${title}:`, error);
  }

  // Show toast notification if enabled
  if (showToast) {
    toast({
      title,
      description: description || errorMessage,
      variant: "destructive",
    });
  }
}

// Helper function specifically for mutation error handling
export function createMutationErrorHandler(
  title: string,
  defaultDescription?: string
) {
  return (error: unknown) => {
    handleApiError(error, {
      title,
      description: defaultDescription
    });
  };
}