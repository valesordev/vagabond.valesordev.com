import rawData from "./vagabond-data.json";

export type TripSummary = {
  id: string;
  name: string;
  window: string;
  origin: string;
  destination: string;
  totalMiles: number;
  driveHours: number;
  homeTz: string;
  campNights: number;
  workStops: number;
  meetings: number;
  status: string;
  crossesTz: string;
};

export type StopKind = "origin" | "workstop" | "camp" | "destination" | "waypoint";

export type Meeting = {
  id: string;
  title: string;
  duration: number;
  homeTime: string;
  localTime: string;
  connectivity: string;
};

export type StopFallback = {
  name: string;
  note: string;
  coords: [number, number];
};

export type Stop = {
  id: string;
  kind: StopKind;
  name: string;
  loc: string;
  coords: [number, number];
  day: number;
  arrival?: string;
  arrivalLocal?: string;
  departure?: string;
  preBuffer?: number;
  postBuffer?: number;
  preBufferMargin?: number;
  postBufferMargin?: number;
  feasible?: "ok" | "warn";
  feasibleReason?: string;
  connectivity?: string;
  fallback?: StopFallback;
  meetings?: Meeting[];
};

export type TripDay = {
  num: number;
  date: string;
  title: string;
  miles: number;
  hours: number;
};

export type CatalogLocationType =
  | "campsite"
  | "trailhead"
  | "water"
  | "poi"
  | "hazard"
  | "workspot";

export type CatalogLocation = {
  id: string;
  name: string;
  type: CatalogLocationType;
  jurisdiction: string;
  landUnit: string;
  coords: [number, number];
  visits: number;
  lastVisit: string | null;
  conditions: string;
  elev: number;
  sky: string;
  cellSignal: number;
  starlinkOk: boolean;
  water: boolean;
  fee: string;
  notes: number;
  hazard?: string;
  conditions_date?: string;
};

export type PowerLoad = {
  name: string;
  watts: number;
  hours: number;
  daily: number;
};

export type BudgetCategory = {
  key: string;
  label: string;
  planned: number;
  actual?: number;
  tone?: string;
  note?: string;
};

export type TransactionRow = {
  id: string;
  date: string;
  merchant: string;
  raw: string;
  amount: number;
  category: string;
  status: "matched" | "needs-review";
  confidence: number;
  note?: string;
};

export type FieldLog = {
  id: string;
  tripId: string;
  tripName: string;
  day: number;
  date: string;
  location: string;
  weather: string;
  notes: string;
  power: number;
  water: number;
  fuel: number;
  waypoints: string[];
  photos: number;
  synced: boolean;
};

export type ProjectPoint = { x: number; y: number };

export type DashboardKpi = {
  label: string;
  value: string;
  unit?: string;
  foot: string;
  accent?: boolean;
};

export type DashboardReconcileMetric = {
  label: string;
  predicted: string;
  actual: string;
  unit: string;
  delta: number;
};

export type DashboardData = {
  todayLine: string;
  headline: string;
  upcoming: {
    sectionRight: string;
    tripDate: { month: string; day: number; year: number };
    routeSubtitle: string;
    feasibilityLabel: string;
  };
  kpis: DashboardKpi[];
  lastTripReconcile: DashboardReconcileMetric[];
  catalogCounts: { label: string; count: number }[];
  catalogTotal: number;
};

export type VagabondMockData = Omit<typeof rawData, "stops" | "catalog" | "routeViaPoints"> & {
  dashboard: DashboardData;
  stops: Stop[];
  catalog: CatalogLocation[];
  routeViaPoints: [number, number][];
  lonToX: (lon: number) => number;
  latToY: (lat: number) => number;
  project: (lng: number, lat: number) => ProjectPoint;
};

const lonToX = (lon: number) => ((lon + 120) / 38) * 1200;
const latToY = (lat: number) => ((38 - lat) / 11) * 640;
const project = (lng: number, lat: number): ProjectPoint => ({
  x: lonToX(lng),
  y: latToY(lat),
});

let cached: VagabondMockData | null = null;

export function getVagabondMockData(): VagabondMockData {
  if (!cached) {
    cached = {
      ...rawData,
      lonToX,
      latToY,
      project,
    } as VagabondMockData;
  }
  return cached;
}
