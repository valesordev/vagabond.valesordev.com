"use client";

import { useRouter } from "next/navigation";
import type { LifestyleNavigateProps, LifestyleScreen } from "./types";

const SCREEN_PATHS: Record<LifestyleScreen, string> = {
  dashboard: "/",
  planner: "/lifestyle/planner",
  "trip-detail": "/lifestyle/trip-detail",
  budget: "/lifestyle/budget",
  catalog: "/lifestyle/catalog",
  "location-detail": "/lifestyle/catalog",
  "field-log": "/lifestyle/field-log",
  reconcile: "/lifestyle/reconcile",
  monitor: "/lifestyle/monitor",
  settings: "/lifestyle/settings",
};

export function useLifestyleNavigate({ onNavigate }: LifestyleNavigateProps = {}) {
  const router = useRouter();

  return (screen: LifestyleScreen) => {
    if (onNavigate) {
      onNavigate(screen);
      return;
    }
    router.push(SCREEN_PATHS[screen]);
  };
}
