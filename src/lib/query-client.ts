import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes before marking as stale
        staleTime: 1000 * 60 * 5,
        // Keep cached data in memory for 10 minutes
        gcTime: 1000 * 60 * 10,
        // Retry failed requests with exponential backoff
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false;
          }
          // Retry up to 3 times for 5xx errors or network errors
          return failureCount < 3;
        },
        // Wait time between retries (exponential backoff)
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus to keep data fresh
        refetchOnWindowFocus: true,
        // Refetch on mount if data is stale
        refetchOnMount: true,
      },
      mutations: {
        // Don't retry mutations - they have side effects
        retry: 1,
        // Slightly shorter retry delay for mutations
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  });
};

// Create a singleton instance for server-side use
export const queryClient = createQueryClient();
