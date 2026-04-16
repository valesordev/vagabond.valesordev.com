"use client";

import { signIn, signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

type AppShellUserMenuProps = {
  className?: string;
  /** Narrow header: omit email/name and use inline button width */
  compact?: boolean;
};

export function AppShellUserMenu({ className, compact }: AppShellUserMenuProps) {
  const { data: session, status } = useSession();

  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.trim() ||
    null;

  if (status === "loading") {
    return <div className={className} aria-hidden />;
  }

  if (session) {
    return (
      <div className={`flex flex-col gap-2 ${className ?? ""}`}>
        {!compact && displayName ? (
          <p className="truncate px-1 text-xs text-muted-foreground" title={displayName}>
            {displayName}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={compact ? "w-auto shrink-0" : "w-full"}
          onClick={() => void signOut()}
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        type="button"
        size="sm"
        className={compact ? "w-auto shrink-0" : "w-full"}
        onClick={() => void signIn("keycloak")}
      >
        Sign In
      </Button>
    </div>
  );
}
