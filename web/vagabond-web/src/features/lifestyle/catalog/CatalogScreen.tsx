"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getVagabondMockData, type CatalogLocationType } from "@/lib/mock/vagabond-data";
import { SimpleTopbar } from "../primitives";
import type { LifestyleNavigateProps } from "../types";
import { CatalogMap } from "./CatalogMap";
import { Signal, TYPE_META, TypeChip } from "./catalog-primitives";

const JURISDICTIONS = ["BLM", "NPS", "USFS", "StateParks", "Private", "Unknown"] as const;
const CONDITIONS = ["good", "watch", "avoid", "untested"] as const;

export type CatalogScreenProps = LifestyleNavigateProps & {
  onLocSelect?: (id: string) => void;
};

export function CatalogScreen({ onLocSelect }: CatalogScreenProps = {}) {
  const router = useRouter();
  const D = getVagabondMockData();
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<Set<CatalogLocationType>>(() => new Set(Object.keys(TYPE_META) as CatalogLocationType[]));
  const [jurisdictions, setJurisdictions] = useState<Set<string>>(() => new Set(JURISDICTIONS));
  const [conditions, setConditions] = useState<Set<string>>(() => new Set(CONDITIONS));
  const [selected, setSelected] = useState(D.catalog[0].id);

  const toggleSet = <T extends string>(s: Set<T>, v: T, setter: (next: Set<T>) => void) => {
    const next = new Set(s);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setter(next);
  };

  const filtered = useMemo(() => {
    return D.catalog.filter(
      (l) =>
        types.has(l.type) &&
        jurisdictions.has(l.jurisdiction) &&
        conditions.has(l.conditions) &&
        (query === "" ||
          l.name.toLowerCase().includes(query.toLowerCase()) ||
          l.landUnit.toLowerCase().includes(query.toLowerCase())),
    );
  }, [query, types, jurisdictions, conditions, D.catalog]);

  const counts = useMemo(() => {
    const c: Partial<Record<CatalogLocationType, number>> = {};
    D.catalog.forEach((l) => {
      c[l.type] = (c[l.type] || 0) + 1;
    });
    return c;
  }, [D.catalog]);

  const jurCounts = useMemo(() => {
    const c: Record<string, number> = {};
    D.catalog.forEach((l) => {
      c[l.jurisdiction] = (c[l.jurisdiction] || 0) + 1;
    });
    return c;
  }, [D.catalog]);

  const openDetail = (id: string) => {
    onLocSelect?.(id);
    router.push(`/lifestyle/catalog/${id}`);
  };

  return (
    <>
      <SimpleTopbar crumb={`Catalog · ${D.catalog.length} locations`} title="Locations">
        <span className="pill neutral">{filtered.length} shown</span>
        <button type="button" className="btn-sm ghost">
          Import GPX
        </button>
        <button type="button" className="btn-sm ghost">
          Import KML
        </button>
        <button type="button" className="btn-sm">
          + New location
        </button>
      </SimpleTopbar>

      <div className="catalog">
        <aside className="catalog-filters">
          <input
            type="text"
            placeholder="Search name or land unit…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: 13,
              border: "1px solid var(--color-line)",
              borderRadius: 4,
              background: "var(--color-bg)",
              marginBottom: 18,
            }}
          />

          <h3>Type</h3>
          <div className="chip-group">
            {(Object.entries(TYPE_META) as [CatalogLocationType, (typeof TYPE_META)[CatalogLocationType]][]).map(([k, m]) => (
              <button
                key={k}
                type="button"
                className={`chip ${types.has(k) ? "on" : ""}`}
                onClick={() => toggleSet(types, k, setTypes)}
              >
                <span className="sw" style={{ background: m.color }} />
                {m.label} <span style={{ opacity: 0.7, marginLeft: 2 }}>{counts[k as CatalogLocationType] || 0}</span>
              </button>
            ))}
          </div>

          <h3 style={{ marginTop: 22 }}>Jurisdiction</h3>
          <div className="chip-group">
            {JURISDICTIONS.map((j) => (
              <button
                key={j}
                type="button"
                className={`chip ${jurisdictions.has(j) ? "on" : ""}`}
                onClick={() => toggleSet(jurisdictions, j, setJurisdictions)}
              >
                {j} <span style={{ opacity: 0.7, marginLeft: 2 }}>{jurCounts[j] || 0}</span>
              </button>
            ))}
          </div>

          <h3 style={{ marginTop: 22 }}>Conditions</h3>
          <div className="chip-group">
            {(
              [
                ["good", "Good"],
                ["watch", "Watch"],
                ["avoid", "Avoid"],
                ["untested", "Untested"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`chip ${conditions.has(key) ? "on" : ""}`}
                onClick={() => toggleSet(conditions, key, setConditions)}
              >
                <span className={`cond-dot cond-${key}`} />
                {label}
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: 24,
              padding: 12,
              background: "var(--color-bg-lift)",
              borderRadius: 6,
              fontSize: 11.5,
              lineHeight: 1.5,
              color: "var(--color-text-soft)",
            }}
          >
            Catalog is a persistent, cross-trip dataset. Imports from GPX/KML land here first; the trip planner
            references locations by ID.
          </div>
        </aside>

        <div className="catalog-body">
          <div className="catalog-table-wrap">
            <table className="catalog-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Jurisdiction</th>
                  <th>Cond.</th>
                  <th>Visits</th>
                  <th>Last visit</th>
                  <th>Cell</th>
                  <th>Starlink</th>
                  <th>Water</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    className={l.id === selected ? "selected" : ""}
                    onClick={() => setSelected(l.id)}
                    onDoubleClick={() => openDetail(l.id)}
                  >
                    <td>
                      <span className="cond-dot" style={{ background: TYPE_META[l.type].color }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-soft)" }}>{l.landUnit}</div>
                    </td>
                    <td>
                      <TypeChip type={l.type} />
                    </td>
                    <td className="jur-tag">{l.jurisdiction}</td>
                    <td>
                      <span className={`cond-dot cond-${l.conditions}`} />
                      <span style={{ textTransform: "capitalize", fontSize: 12 }}>{l.conditions}</span>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {l.visits}
                    </td>
                    <td className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>
                      {l.lastVisit || "—"}
                    </td>
                    <td>
                      <Signal bars={l.cellSignal} />
                    </td>
                    <td>
                      {l.starlinkOk ? (
                        <span className="mono" style={{ fontSize: 11, color: "var(--ok)" }}>
                          ✓ Sky
                        </span>
                      ) : (
                        <span className="mono" style={{ fontSize: 11, color: "var(--err)" }}>
                          blocked
                        </span>
                      )}
                    </td>
                    <td className="mono" style={{ fontSize: 11 }}>
                      {l.water ? "Yes" : "—"}
                    </td>
                    <td className="mono" style={{ fontSize: 11, color: "var(--color-text-soft)" }}>
                      {l.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="catalog-map-wrap">
            <CatalogMap locations={filtered} selectedId={selected} setSelected={setSelected} />
            <div className="map-overlay tl">
              <div className="micro" style={{ marginBottom: 6 }}>
                Catalog map
              </div>
              <div style={{ fontSize: 11.5, color: "var(--color-text-soft)" }}>
                {filtered.length} of {D.catalog.length} locations &middot;{" "}
                <span className="mono" style={{ fontSize: 10 }}>
                  PMTiles offline
                </span>
              </div>
            </div>
            <div className="map-overlay br">
              <div className="micro" style={{ marginBottom: 8 }}>
                Type legend
              </div>
              <div className="map-legend">
                {Object.entries(TYPE_META).map(([k, m]) => (
                  <div key={k} className="map-legend-row">
                    <span className="sw" style={{ background: m.color }} /> {m.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
