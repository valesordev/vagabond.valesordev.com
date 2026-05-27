import { AppShell } from "@/components/AppShell";

export default function LifestyleLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
