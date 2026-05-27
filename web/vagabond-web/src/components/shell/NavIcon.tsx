export type NavIconName =
  | "dashboard"
  | "trip"
  | "planner"
  | "budget"
  | "location"
  | "log"
  | "monitor"
  | "reconcile"
  | "settings";

type NavIconProps = {
  name: NavIconName;
};

const common = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function NavIcon({ name }: NavIconProps) {
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "trip":
      return (
        <svg {...common}>
          <path d="M3 12c0-4 4-7 9-7s9 3 9 7-4 7-9 7c-2 0-3.5-.5-5-1.5L3 19l1.5-3C3.5 15 3 13.5 3 12z" />
          <circle cx="8" cy="12" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="16" cy="12" r="1" />
        </svg>
      );
    case "planner":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M7.5 7.5l5 5" strokeDasharray="2 2" />
          <path d="M13 11l3-5M13 13l3 5" strokeDasharray="2 2" />
        </svg>
      );
    case "budget":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18" />
          <path d="M7 14h4M7 17h6" />
        </svg>
      );
    case "location":
      return (
        <svg {...common}>
          <path d="M12 21s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      );
    case "log":
      return (
        <svg {...common}>
          <path d="M5 3h11l3 3v15H5z" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      );
    case "monitor":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </svg>
      );
    case "reconcile":
      return (
        <svg {...common}>
          <path d="M3 6h18M3 18h18" />
          <path d="M7 6l-3 3 3 3M17 12l3 3-3 3" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}
