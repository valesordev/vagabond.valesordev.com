"use client";

export function ImportTile({ onLoad }: { onLoad: () => void }) {
  return (
    <div className="import-tile">
      <div className="import-tile-icon">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18" />
          <path d="M12 12v6M9 15l3 3 3-3" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500 }}>
          Drop a statement here
        </h4>
        <p style={{ margin: "4px 0 12px", color: "var(--color-text-soft)", fontSize: 13, lineHeight: 1.5 }}>
          CSV or QFX from any bank or card issuer. Vagabond parses locally &mdash; nothing leaves your server.
          We&rsquo;ll match merchants against your category dictionary and flag anything ambiguous.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn-sm" onClick={onLoad}>
            Choose file
          </button>
          <button type="button" className="btn-sm ghost" onClick={onLoad}>
            Paste rows
          </button>
          <button type="button" className="btn-sm ghost" onClick={onLoad}>
            Use sample (Chase Apr)
          </button>
        </div>
      </div>
    </div>
  );
}
