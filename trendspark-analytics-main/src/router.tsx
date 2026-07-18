import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

let clientQueryClientSingleton: QueryClient | undefined;

function getQueryClient() {
  const queryClientOptions = {
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount: number, error: unknown) => {
          if (error && typeof error === "object") {
            const status = (error as { status?: number }).status;
            if (status === 401 || status === 403 || status === 404 || status === 400) {
              return false;
            }
          }
          return failureCount < 2;
        },
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
      },
    },
  };

  if (typeof window === "undefined") {
    return new QueryClient(queryClientOptions);
  }

  if (!clientQueryClientSingleton) {
    clientQueryClientSingleton = new QueryClient(queryClientOptions);
  }
  return clientQueryClientSingleton;
}

export const getRouter = () => {
  const queryClient = getQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 1000 * 60 * 5,
  });

  return router;
};
