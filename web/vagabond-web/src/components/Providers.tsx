"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

import { AuthSync } from "@/components/AuthSync";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 2,
            networkMode: "offlineFirst",
          },
          mutations: {
            retry: 2,
            networkMode: "offlineFirst",
          },
        },
      }),
  );

  return (
    <SessionProvider
      // Seconds: hit /api/auth/session so the JWT callback can refresh tokens before stale Bearer calls.
      refetchInterval={120}
      refetchOnWindowFocus
    >
      <QueryClientProvider client={queryClient}>
        <AuthSync />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
