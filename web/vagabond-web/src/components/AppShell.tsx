"use client";

import Link from "next/link";

import { AppShellUserMenu } from "@/components/AppShellUserMenu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/trips", label: "Trips", disabled: false },
  { href: "/rig", label: "Rig", disabled: false },
] as const;

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 flex-col border-r border-border/80 bg-card/70 px-4 py-5 md:flex">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold tracking-tight">Vagabond</h1>
          <p className="text-sm text-muted-foreground">Offline-first overland planner</p>
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
        <div className="mt-auto border-t border-border/80 pt-4">
          <AppShellUserMenu />
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="border-b border-border/80 bg-card/40 px-4 py-3 md:hidden">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Vagabond</p>
              <p className="text-xs text-muted-foreground">Overland planner</p>
            </div>
            <div className="shrink-0">
              <AppShellUserMenu compact />
            </div>
          </div>
          <nav className="flex gap-2">
            {navItems.map((item) =>
              item.disabled ? (
                <span key={item.label} className="text-xs text-muted-foreground opacity-50">
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2 py-1 text-xs font-medium hover:bg-muted"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
