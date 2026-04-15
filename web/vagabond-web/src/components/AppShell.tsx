import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/trips", label: "Trips", disabled: false },
  { href: "#", label: "Gear", disabled: true },
] as const;

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 border-r border-border/80 bg-card/70 px-4 py-5 md:block">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold tracking-tight">Vagabond</h1>
          <p className="text-sm text-muted-foreground">Offline-first overland planner</p>
          <Badge variant="secondary">Dev auth header mode</Badge>
        </div>
        <Separator className="my-4" />
        <nav className="space-y-1">
          {navItems.map((item) =>
            item.disabled ? (
              <span
                key={item.label}
                aria-disabled
                className={cn(
                  "block rounded-md px-3 py-2 text-sm text-muted-foreground opacity-50",
                  "cursor-not-allowed",
                )}
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
