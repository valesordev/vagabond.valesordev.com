"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppShellUserMenu } from "@/components/AppShellUserMenu";
import { ConnectivityBannerFromPrefs } from "@/components/shell/ConnectivityBanner";
import { NavIcon, type NavIconName } from "@/components/shell/NavIcon";

type AppShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  count?: string | number;
  matchPrefix?: string;
};

const tripNav: NavItem[] = [
  { href: "/lifestyle", label: "Dashboard", icon: "dashboard" },
  { href: "/lifestyle/planner", label: "Trip planner", icon: "planner", count: "GA" },
  { href: "/lifestyle/trip-detail", label: "Trip detail", icon: "trip" },
  { href: "/lifestyle/budget", label: "Budgets", icon: "budget" },
];

const inFieldNav: NavItem[] = [
  { href: "/lifestyle/monitor", label: "Real-time monitor", icon: "monitor", count: "live" },
  { href: "/lifestyle/field-log", label: "Field log", icon: "log" },
  { href: "/lifestyle/reconcile", label: "Reconcile", icon: "reconcile", count: "1" },
];

const catalogNav: NavItem[] = [
  {
    href: "/lifestyle/catalog",
    label: "Locations",
    icon: "location",
    count: 142,
    matchPrefix: "/lifestyle/catalog",
  },
];

const systemNav: NavItem[] = [
  { href: "/lifestyle/settings", label: "Settings", icon: "settings" },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.matchPrefix) {
    return pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`);
  }
  return pathname === item.href;
}

function SidebarNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item);

  return (
    <Link
      href={item.href}
      className={`nav-item ${active ? "active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="nav-icon">
          <NavIcon name={item.icon} />
        </span>
        {item.label}
      </span>
      {item.count !== undefined && <span className="nav-count">{item.count}</span>}
    </Link>
  );
}

function NavSection({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <>
      <div className="nav-section">{title}</div>
      {items.map((item) => (
        <SidebarNavItem key={item.href} item={item} pathname={pathname} />
      ))}
    </>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">V</div>
          <div>
            <div className="brand-name">Vagabond</div>
            <div className="brand-sub">Lifestyle manager</div>
          </div>
        </div>

        <nav className="nav">
          <NavSection title="Trip" items={tripNav} pathname={pathname} />
          <NavSection title="In field" items={inFieldNav} pathname={pathname} />
          <NavSection title="Catalog" items={catalogNav} pathname={pathname} />
          <NavSection title="System" items={systemNav} pathname={pathname} />
        </nav>

        <div className="sidebar-footer">
          <span className="dot" /> Self-hosted · <span className="mono" style={{ fontSize: 11 }}>v0.3.1</span>
          <div style={{ marginLeft: "auto" }}>
            <AppShellUserMenu compact />
          </div>
        </div>
      </aside>

      <main className="main">
        <ConnectivityBannerFromPrefs />
        {children}
      </main>
    </div>
  );
}
