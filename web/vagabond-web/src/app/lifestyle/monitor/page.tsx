"use client";

import { useLifestylePreferences } from "@/contexts/LifestylePreferencesContext";
import { MonitorScreen } from "@/features/lifestyle/monitor/MonitorScreen";

export default function MonitorPage() {
  const { connectivity } = useLifestylePreferences();
  return <MonitorScreen connectivity={connectivity} />;
}
