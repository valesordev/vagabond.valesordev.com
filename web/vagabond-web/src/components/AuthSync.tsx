"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

import { setAuthToken } from "@/lib/api";

export function AuthSync() {
  const { data: session } = useSession();

  useEffect(() => {
    setAuthToken(session?.accessToken);
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      void signOut({ callbackUrl: "/" });
    }
  }, [session?.error]);

  return null;
}
