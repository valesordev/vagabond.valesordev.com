"use client";

import { useState } from "react";
import type { LifestyleNavigateProps } from "../types";
import {
  AccountSettings,
  CalendarSettings,
  CatalogSettings,
  IntegrationsSettings,
  NavSettings,
  RigSettings,
  TelemetrySettings,
} from "./settings-sections";

type SettingsSection =
  | "rig"
  | "integrations"
  | "calendar"
  | "telemetry"
  | "catalog"
  | "nav"
  | "account";

const SECTIONS: [SettingsSection, string][] = [
  ["rig", "Rig profile"],
  ["integrations", "Integrations"],
  ["calendar", "Calendar"],
  ["telemetry", "Telemetry"],
  ["catalog", "Location catalog"],
  ["nav", "Navigation"],
  ["account", "Account & sync"],
];

export function SettingsScreen(_props: LifestyleNavigateProps = {}) {
  const [section, setSection] = useState<SettingsSection>("rig");

  return (
    <div className="page page-narrow">
      <div style={{ marginBottom: 24 }}>
        <div className="micro">Settings</div>
        <h1 style={{ margin: "6px 0 0", fontSize: 32, fontFamily: "var(--font-display)", fontWeight: 500 }}>
          The rig, the integrations, the defaults.
        </h1>
      </div>

      <div className="settings-grid">
        <nav className="settings-nav">
          {SECTIONS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`nav-item ${section === k ? "active" : ""}`}
              onClick={() => setSection(k)}
            >
              {label}
            </button>
          ))}
        </nav>

        <section>
          {section === "rig" && <RigSettings />}
          {section === "integrations" && <IntegrationsSettings />}
          {section === "calendar" && <CalendarSettings />}
          {section === "telemetry" && <TelemetrySettings />}
          {section === "catalog" && <CatalogSettings />}
          {section === "nav" && <NavSettings />}
          {section === "account" && <AccountSettings />}
        </section>
      </div>
    </div>
  );
}
