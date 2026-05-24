"use client";

import { useLifestylePreferences } from "@/contexts/LifestylePreferencesContext";
import { FieldLogScreen } from "@/features/lifestyle/field-log/FieldLogScreen";

export default function FieldLogPage() {
  const { connectivity } = useLifestylePreferences();
  return <FieldLogScreen connectivity={connectivity} />;
}
