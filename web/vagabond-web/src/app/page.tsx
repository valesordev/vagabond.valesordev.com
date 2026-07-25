"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { listRigs, setAuthToken } from "@/lib/api";

const DEV_AUTH = process.env.NEXT_PUBLIC_VAGABOND_DEV_AUTH === "true";

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) {
      return;
    }

    async function routeFromRigPresence() {
      if (!DEV_AUTH) {
        if (status === "loading") {
          return;
        }
        if (status === "unauthenticated") {
          redirected.current = true;
          router.replace("/trips");
          return;
        }
        if (typeof session?.accessToken === "string") {
          setAuthToken(session.accessToken);
        }
      }

      try {
        const envelope = await listRigs();
        redirected.current = true;
        router.replace(envelope.data.length > 0 ? "/trips" : "/rig");
      } catch {
        redirected.current = true;
        router.replace("/trips");
      }
    }

    void routeFromRigPresence();
  }, [router, session?.accessToken, status]);

  return (
    <main className="p-6 md:p-8">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </main>
  );
}
