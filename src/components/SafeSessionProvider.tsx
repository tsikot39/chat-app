import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SafeSessionProviderProps {
  children: ReactNode;
  session?: unknown;
}

export default function SafeSessionProvider({
  children,
  session,
}: SafeSessionProviderProps) {
  return (
    <SessionProvider
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session={session as any}
      refetchInterval={0} // Disable automatic refetching
      refetchOnWindowFocus={false} // Disable refetch on window focus
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  );
}
