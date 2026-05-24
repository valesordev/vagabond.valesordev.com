"use client";

import { useLifestylePreferences } from "@/contexts/LifestylePreferencesContext";

export function ConnectivityBanner() {
  const { connectivity: conn } = useLifestylePreferences();

  if (conn === "online") {
    return null;
  }

  if (conn === "starlink") {
    return (
      <div className="conn-banner starlink">
        <span className="dot" />
        <span>
          <b>Starlink LAN only.</b> Local server reachable. External integrations (Google Calendar push,
          agentic enrichment) are queued until uplink.
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "#5a3a26",
          }}
        >
          uplink: standby
        </span>
      </div>
    );
  }

  return (
    <div className="conn-banner offline">
      <span className="dot" />
      <span>
        <b>Offline.</b> Per ADR-008, v0.1 has no offline-write store. Reads work from cached state · writes
        will not persist until reachability returns.
      </span>
      <span
        style={{
          marginLeft: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "#7a2a1d",
        }}
      >
        1 log queued · 4 photos pending
      </span>
    </div>
  );
}
