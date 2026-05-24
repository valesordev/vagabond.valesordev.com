"use client";

import { useState } from "react";
import {
  useLifestylePreferences,
  type ConnectivityMode,
  type DensityMode,
} from "@/contexts/LifestylePreferencesContext";
import { FieldRow, SectionHead2, Toggle } from "../primitives";

export function RigSettings() {
  const [solar, setSolar] = useState(true);
  return (
    <>
      <SectionHead2 title="Rig profile" sub="The truck, the panels, the battery, the tanks." />
      <FieldRow label="Rig name" hint="Used in trip names and logs.">
        <input type="text" defaultValue="The Cab — 2018 F-250" style={{ width: 320 }} />
      </FieldRow>
      <FieldRow label="Solar array" hint="Panel count × peak watts.">
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" defaultValue="2" style={{ width: 72 }} />
          <span style={{ alignSelf: "center" }}>×</span>
          <input type="number" defaultValue="200" style={{ width: 100 }} />{" "}
          <span style={{ alignSelf: "center", color: "var(--color-text-soft)" }}>W</span>
        </div>
      </FieldRow>
      <FieldRow label="Battery capacity" hint="Useful capacity after derating.">
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" defaultValue="3072" style={{ width: 120 }} />{" "}
          <span style={{ alignSelf: "center", color: "var(--color-text-soft)" }}>Wh</span>
        </div>
      </FieldRow>
      <FieldRow label="Fresh water capacity" hint="On-board tank capacity.">
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" defaultValue="18" style={{ width: 100 }} />{" "}
          <span style={{ alignSelf: "center", color: "var(--color-text-soft)" }}>gal</span>
        </div>
      </FieldRow>
      <FieldRow
        label="Daily water rate"
        hint="Personal consumption baseline. Calibrated from logs after first 5 trips."
      >
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" step="0.1" defaultValue="2.4" style={{ width: 100 }} />{" "}
          <span style={{ alignSelf: "center", color: "var(--color-text-soft)" }}>gal/day</span>
        </div>
      </FieldRow>
      <FieldRow label="Solar enabled" hint="Disable for parked-without-sun planning runs.">
        <Toggle on={solar} onChange={setSolar} />
      </FieldRow>
      <FieldRow label="Home time zone" hint="Meetings anchor here. Local TZ resolves from stop coordinates.">
        <select defaultValue="PDT" style={{ width: 220 }}>
          <option>PDT (UTC−7)</option>
          <option>MDT (UTC−6)</option>
          <option>CDT (UTC−5)</option>
          <option>EDT (UTC−4)</option>
        </select>
      </FieldRow>
    </>
  );
}

export function IntegrationRow({
  name,
  status,
  detail,
}: {
  name: string;
  status: "connected" | "not-connected" | "export-only" | "opt-in";
  detail: string;
}) {
  const pillCls = status === "connected" ? "ok" : status === "opt-in" ? "neutral" : "neutral";
  const label =
    status === "connected"
      ? "Connected"
      : status === "export-only"
        ? "Export only"
        : status === "opt-in"
          ? "Opt-in"
          : "Not connected";
  return (
    <div className="field-row">
      <div>
        <div className="field-label">{name}</div>
        <div className="field-hint">{detail}</div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span className={`pill ${pillCls}`}>
          <span className="dot" />
          {label}
        </span>
        <button type="button" className="btn-sm ghost">
          {status === "connected" ? "Manage" : "Connect"}
        </button>
      </div>
    </div>
  );
}

export function IntegrationsSettings() {
  return (
    <>
      <SectionHead2
        title="Integrations"
        sub="External services. All optional. Vagabond runs without any of them."
      />
      <IntegrationRow
        name="Google Calendar"
        status="connected"
        detail="brian@solo7.media · scopes: calendar.events"
      />
      <IntegrationRow name="Apple Maps" status="not-connected" detail="No API. Used externally for highway transit." />
      <IntegrationRow name="Gaia GPS" status="export-only" detail="GPX export tested against Gaia v2024.6." />
      <IntegrationRow
        name="OsmAnd"
        status="export-only"
        detail="Recommended FOSS field nav for the open-source community."
      />
      <IntegrationRow name="iOverlander" status="not-connected" detail="Structured data import (planned v0.2)." />
      <IntegrationRow
        name="recreation.gov"
        status="not-connected"
        detail="Permit + availability lookups (planned v0.2)."
      />
      <IntegrationRow
        name="Anthropic Claude"
        status="opt-in"
        detail="Powers agentic location enrichment (v0.4). Disabled by default."
      />
    </>
  );
}

export function CalendarSettings() {
  const [autoPush, setAutoPush] = useState(true);
  const [prepEvent, setPrepEvent] = useState(true);
  return (
    <>
      <SectionHead2
        title="Calendar sync"
        sub="One-way push from Vagabond to Google Calendar. Vagabond is the source of truth."
      />
      <FieldRow label="Auto-push on trip save" hint="When a trip is saved with confirmed dates, events sync automatically.">
        <Toggle on={autoPush} onChange={setAutoPush} />
      </FieldRow>
      <FieldRow label="Prep & pack event" hint="Adds an all-day event the day before departure.">
        <Toggle on={prepEvent} onChange={setPrepEvent} />
      </FieldRow>
      <FieldRow label="Event title prefix" hint="Prepended to every generated event.">
        <input type="text" defaultValue="🚐 Vagabond" style={{ width: 220 }} />
      </FieldRow>
      <FieldRow label="ICS export" hint="One-click download of any trip as .ics. Works without OAuth.">
        <button type="button" className="btn-sm ghost">
          Download last trip .ics
        </button>
      </FieldRow>
    </>
  );
}

export function TelemetrySettings() {
  return (
    <>
      <SectionHead2 title="Telemetry & observability" sub="OpenTelemetry export, optional Grafana sidecar. Off by default." />
      <FieldRow label="OTLP exporter" hint="Send traces & metrics to any OTLP collector.">
        <select defaultValue="off">
          <option value="off">Off</option>
          <option>Console</option>
          <option>OTLP/HTTP</option>
        </select>
      </FieldRow>
      <FieldRow label="Grafana sidecar" hint="Local Prometheus + Grafana via docker-compose --profile observability.">
        <Toggle on={false} onChange={() => {}} />
      </FieldRow>
      <FieldRow label="Anonymized usage stats" hint="None collected. Telemetry never leaves your stack.">
        <span className="pill ok">
          <span className="dot" />
          Self-hosted only
        </span>
      </FieldRow>
    </>
  );
}

export function CatalogSettings() {
  return (
    <>
      <SectionHead2
        title="Location catalog"
        sub="Campsites, trailheads, water sources, POIs. Imported, scraped, hand-entered."
      />
      <FieldRow label="Default jurisdiction" hint="Used when import data is ambiguous.">
        <select defaultValue="BLM">
          <option>BLM</option>
          <option>NPS</option>
          <option>USFS</option>
          <option>State Parks</option>
          <option>Private</option>
          <option>Unknown</option>
        </select>
      </FieldRow>
      <FieldRow label="Agentic enrichment" hint="LLM-assisted research per ADR-011. Deferred to v0.4. Opt-in per location.">
        <span className="pill neutral">
          <span className="dot" />
          Disabled · v0.4
        </span>
      </FieldRow>
      <FieldRow label="Soft-delete locations" hint="Restrict delete if referenced by a trip; soft-delete otherwise.">
        <Toggle on={true} onChange={() => {}} />
      </FieldRow>
    </>
  );
}

export function NavSettings() {
  return (
    <>
      <SectionHead2
        title="Field navigation"
        sub="Per ADR-013, the recommended stack diverges between project and personal use."
      />
      <FieldRow label="Primary field nav" hint="Used for GPX export targets and recommended in-trip handoff.">
        <select defaultValue="apple-gaia">
          <option value="apple-gaia">Apple Maps + Gaia GPS (personal)</option>
          <option>OsmAnd (project default)</option>
        </select>
      </FieldRow>
      <FieldRow label="GPX export format" hint="GPX 1.1 is the interchange format per ADR-005.">
        <span className="mono" style={{ fontSize: 12 }}>
          GPX 1.1 · UTF-8
        </span>
      </FieldRow>
      <FieldRow label="Map basemap" hint="Offline PMTiles (OSM). Optional online satellite enrichment.">
        <select defaultValue="pmtiles">
          <option value="pmtiles">PMTiles · OSM (offline)</option>
          <option>+ MapTiler satellite (online)</option>
        </select>
      </FieldRow>
    </>
  );
}

export function AccountSettings() {
  const { density, connectivity, setDensity, setConnectivity } = useLifestylePreferences();

  return (
    <>
      <SectionHead2 title="Account & sync" sub="Keycloak identity. Self-hosted, single-user for v0.1." />
      <FieldRow label="UI density" hint="Compact is for the in-cab tablet — denser tables, smaller controls.">
        <select
          value={density}
          onChange={(e) => setDensity(e.target.value as DensityMode)}
          style={{ width: 200 }}
        >
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </select>
      </FieldRow>
      <FieldRow
        label="Connectivity preview"
        hint="Simulate online, Starlink LAN-only, or offline states for field-aware UI."
      >
        <select
          value={connectivity}
          onChange={(e) => setConnectivity(e.target.value as ConnectivityMode)}
          style={{ width: 200 }}
        >
          <option value="online">Online</option>
          <option value="starlink">Starlink</option>
          <option value="offline">Offline</option>
        </select>
      </FieldRow>
      <FieldRow label="Identity provider" hint="Keycloak realm: vagabond. OIDC.">
        <span className="mono" style={{ fontSize: 12 }}>
          brian@solo7.media · realm: vagabond
        </span>
      </FieldRow>
      <FieldRow
        label="Token encryption"
        hint="Google OAuth tokens at rest in Postgres. AES-256-GCM, key via VAGABOND_TOKEN_KEY."
      >
        <span className="pill ok">
          <span className="dot" />
          Encrypted
        </span>
      </FieldRow>
      <FieldRow label="Backups" hint="pg_dump nightly to local NAS share.">
        <span className="mono" style={{ fontSize: 12 }}>
          Last: 03:14 PDT · 42 trips · 218 logs
        </span>
      </FieldRow>
    </>
  );
}
