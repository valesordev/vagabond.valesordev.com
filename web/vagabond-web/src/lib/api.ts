const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
const API_V1_BASE_URL = `${API_BASE_URL}/api/v1`;
// TODO: replace with Keycloak token in MVP-5.
const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export type ApiErrorShape = {
  code: string;
  message: string;
  status: number;
};

export type ApiEnvelope<TData, TMeta = Record<string, unknown> | null> = {
  data: TData;
  meta: TMeta;
  error: ApiErrorShape | null;
};

export type Trip = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ListTripsMeta = {
  total: number;
  limit: number;
  offset: number;
};

export type DeleteTripMeta = {
  deleted: boolean;
};

export type TripLeg = {
  id: string;
  trip_id: string;
  seq: number;
  name: string | null;
};

export type Waypoint = {
  id: string;
  leg_id: string;
  trip_id: string;
  leg_seq: number;
  seq: number;
  name: string;
  notes: string | null;
  lon: number;
  lat: number;
};

export type ListWaypointsMeta = {
  total: number;
};

export type GpxImportResult = {
  leg_id: string;
  leg_name: string;
  waypoints_imported: number;
  routes_imported: number;
};

export type CreateWaypointInput = {
  name: string;
  notes?: string | null;
  lon: number;
  lat: number;
};

export type CreateTripInput = {
  name: string;
  description?: string | null;
};

export type UpdateTripInput = {
  name: string;
  description?: string | null;
};

export type Rig = {
  id: string;
  user_id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  fuel_capacity_gal: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type GearStorageZone = "rear_cargo" | "cargo_carrier" | "cab" | "rooftop" | "other";

export type GearItem = {
  id: string;
  rig_id: string;
  name: string;
  category: string;
  weight_oz: number | null;
  storage_zone: GearStorageZone;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DeleteRigMeta = {
  deleted: boolean;
};

export type FieldLog = {
  id: string;
  trip_id: string;
  log_date: string;
  notes: string | null;
  actual_power_consumed_wh: number | null;
  actual_water_consumed_gal: number | null;
  actual_weather: string | null;
  created_at: string;
  updated_at: string;
};

export type UpsertFieldLogInput = {
  log_date: string;
  notes?: string | null;
  actual_power_consumed_wh?: number | null;
  actual_water_consumed_gal?: number | null;
  actual_weather?: string | null;
};

export type ListFieldLogsMeta = {
  total: number;
};

export type DeleteFieldLogMeta = {
  deleted: boolean;
};

export type CreateRigInput = {
  name: string;
  make: string;
  model: string;
  year: number;
  fuel_capacity_gal?: number | null;
  notes?: string | null;
};

export type UpdateRigInput = CreateRigInput;

export type CreateGearInput = {
  name: string;
  category: string;
  weight_oz?: number | null;
  storage_zone: GearStorageZone;
  notes?: string | null;
};

export type UpdateGearInput = CreateGearInput;

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly meta: Record<string, unknown> | null;

  constructor(message: string, code: string, status: number, meta: Record<string, unknown> | null) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.meta = meta;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_V1_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function request<TData, TMeta = Record<string, unknown> | null>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<TData, TMeta>> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (DEV_USER_ID) {
    headers["X-Vagabond-User-Id"] = DEV_USER_ID;
  }

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  let envelope: ApiEnvelope<TData, TMeta> | null = null;
  try {
    envelope = (await res.json()) as ApiEnvelope<TData, TMeta>;
  } catch {
    envelope = null;
  }

  if (!res.ok || envelope?.error) {
    const fallbackMessage = `API request failed (${res.status})`;
    const apiError = envelope?.error;
    throw new ApiClientError(
      apiError?.message ?? fallbackMessage,
      apiError?.code ?? "API_ERROR",
      apiError?.status ?? res.status,
      (envelope?.meta as Record<string, unknown> | null) ?? null,
    );
  }

  if (!envelope) {
    throw new ApiClientError("API returned an empty response body", "EMPTY_RESPONSE", res.status, null);
  }

  return envelope;
}

export function listTrips(params?: {
  limit?: number;
  offset?: number;
}): Promise<ApiEnvelope<Trip[], ListTripsMeta>> {
  return request<Trip[], ListTripsMeta>("/trips", {
    query: {
      limit: params?.limit,
      offset: params?.offset,
    },
  });
}

export function getTrip(id: string): Promise<ApiEnvelope<Trip, Record<string, never>>> {
  return request<Trip, Record<string, never>>(`/trips/${id}`);
}

export function createTrip(input: CreateTripInput): Promise<ApiEnvelope<Trip, Record<string, never>>> {
  return request<Trip, Record<string, never>>("/trips", {
    method: "POST",
    body: {
      name: input.name,
      description: input.description ?? null,
    },
  });
}

export function updateTrip(id: string, input: UpdateTripInput): Promise<ApiEnvelope<Trip, Record<string, never>>> {
  return request<Trip, Record<string, never>>(`/trips/${id}`, {
    method: "PUT",
    body: {
      name: input.name,
      description: input.description ?? null,
    },
  });
}

export function deleteTrip(id: string): Promise<ApiEnvelope<null, DeleteTripMeta>> {
  return request<null, DeleteTripMeta>(`/trips/${id}`, {
    method: "DELETE",
  });
}

export function listTripLegs(tripId: string): Promise<ApiEnvelope<TripLeg[], ListWaypointsMeta>> {
  return request<TripLeg[], ListWaypointsMeta>(`/trips/${tripId}/legs`);
}

/** Row returned by `GET /trips/:id/waypoints` (flat list; notes may be absent). */
type WaypointListApiRow = Omit<Waypoint, "notes"> & { notes?: string | null };

function normalizeWaypointListRow(row: WaypointListApiRow): Waypoint {
  return {
    ...row,
    notes: row.notes ?? null,
  };
}

type WaypointCreateApiRow = {
  id: string;
  leg_id: string;
  seq: number;
  name: string;
  notes: string | null;
  lon: number;
  lat: number;
};

export function listTripWaypoints(tripId: string): Promise<ApiEnvelope<Waypoint[], ListWaypointsMeta>> {
  return request<WaypointListApiRow[], ListWaypointsMeta>(`/trips/${tripId}/waypoints`).then((envelope) => ({
    ...envelope,
    data: envelope.data.map(normalizeWaypointListRow),
  }));
}

export function createLeg(tripId: string, name?: string): Promise<ApiEnvelope<TripLeg, Record<string, never>>> {
  return request<TripLeg, Record<string, never>>(`/trips/${tripId}/legs`, {
    method: "POST",
    body: name !== undefined ? { name } : {},
  });
}

export function createWaypoint(
  tripId: string,
  legId: string,
  input: CreateWaypointInput,
): Promise<ApiEnvelope<Waypoint, Record<string, never>>> {
  return request<WaypointCreateApiRow, Record<string, never>>(`/trips/${tripId}/legs/${legId}/waypoints`, {
    method: "POST",
    body: {
      name: input.name,
      notes: input.notes ?? null,
      lon: input.lon,
      lat: input.lat,
    },
  }).then((envelope) => ({
    ...envelope,
    data: {
      ...envelope.data,
      trip_id: tripId,
      leg_seq: 0,
      notes: envelope.data.notes ?? null,
    },
  }));
}

export function deleteWaypoint(
  tripId: string,
  legId: string,
  waypointId: string,
): Promise<ApiEnvelope<null, DeleteTripMeta>> {
  return request<null, DeleteTripMeta>(`/trips/${tripId}/legs/${legId}/waypoints/${waypointId}`, {
    method: "DELETE",
  });
}

export async function importGpx(tripId: string, file: File): Promise<ApiEnvelope<GpxImportResult>> {
  const form = new FormData();
  form.append("file", file);

  const headers: HeadersInit = {};
  if (DEV_USER_ID) {
    headers["X-Vagabond-User-Id"] = DEV_USER_ID;
  }

  const res = await fetch(`${API_V1_BASE_URL}/trips/${tripId}/import/gpx`, {
    method: "POST",
    headers,
    body: form,
    cache: "no-store",
  });

  let envelope: ApiEnvelope<GpxImportResult> | null = null;
  try {
    envelope = (await res.json()) as ApiEnvelope<GpxImportResult>;
  } catch {
    envelope = null;
  }

  if (!res.ok || envelope?.error) {
    const fallbackMessage = `API request failed (${res.status})`;
    const apiError = envelope?.error;
    throw new ApiClientError(
      apiError?.message ?? fallbackMessage,
      apiError?.code ?? "API_ERROR",
      apiError?.status ?? res.status,
      (envelope?.meta as Record<string, unknown> | null) ?? null,
    );
  }

  if (!envelope) {
    throw new ApiClientError("API returned an empty response body", "EMPTY_RESPONSE", res.status, null);
  }

  return envelope;
}

export function listRigs(): Promise<ApiEnvelope<Rig[], Record<string, never>>> {
  return request<Rig[], Record<string, never>>("/rigs");
}

export function createRig(input: CreateRigInput): Promise<ApiEnvelope<Rig, Record<string, never>>> {
  return request<Rig, Record<string, never>>("/rigs", {
    method: "POST",
    body: {
      name: input.name,
      make: input.make,
      model: input.model,
      year: input.year,
      fuel_capacity_gal: input.fuel_capacity_gal ?? null,
      notes: input.notes ?? null,
    },
  });
}

export function updateRig(id: string, input: UpdateRigInput): Promise<ApiEnvelope<Rig, Record<string, never>>> {
  return request<Rig, Record<string, never>>(`/rigs/${id}`, {
    method: "PUT",
    body: {
      name: input.name,
      make: input.make,
      model: input.model,
      year: input.year,
      fuel_capacity_gal: input.fuel_capacity_gal ?? null,
      notes: input.notes ?? null,
    },
  });
}

export function deleteRig(id: string): Promise<ApiEnvelope<null, DeleteRigMeta>> {
  return request<null, DeleteRigMeta>(`/rigs/${id}`, {
    method: "DELETE",
  });
}

export function listGear(rigId: string): Promise<ApiEnvelope<GearItem[], Record<string, never>>> {
  return request<GearItem[], Record<string, never>>(`/rigs/${rigId}/gear`);
}

export function createGearItem(
  rigId: string,
  input: CreateGearInput,
): Promise<ApiEnvelope<GearItem, Record<string, never>>> {
  return request<GearItem, Record<string, never>>(`/rigs/${rigId}/gear`, {
    method: "POST",
    body: {
      name: input.name,
      category: input.category,
      weight_oz: input.weight_oz ?? null,
      storage_zone: input.storage_zone,
      notes: input.notes ?? null,
    },
  });
}

export function updateGearItem(
  rigId: string,
  id: string,
  input: UpdateGearInput,
): Promise<ApiEnvelope<GearItem, Record<string, never>>> {
  return request<GearItem, Record<string, never>>(`/rigs/${rigId}/gear/${id}`, {
    method: "PUT",
    body: {
      name: input.name,
      category: input.category,
      weight_oz: input.weight_oz ?? null,
      storage_zone: input.storage_zone,
      notes: input.notes ?? null,
    },
  });
}

export function deleteGearItem(rigId: string, id: string): Promise<ApiEnvelope<null, DeleteRigMeta>> {
  return request<null, DeleteRigMeta>(`/rigs/${rigId}/gear/${id}`, {
    method: "DELETE",
  });
}

export function listFieldLogs(tripId: string): Promise<ApiEnvelope<FieldLog[], ListFieldLogsMeta>> {
  return request<FieldLog[], ListFieldLogsMeta>(`/trips/${tripId}/logs`);
}

export function upsertFieldLog(
  tripId: string,
  date: string,
  input: UpsertFieldLogInput,
): Promise<ApiEnvelope<FieldLog, Record<string, never>>> {
  return request<FieldLog, Record<string, never>>(`/trips/${tripId}/logs/${encodeURIComponent(date)}`, {
    method: "PUT",
    body: {
      log_date: input.log_date,
      notes: input.notes ?? null,
      actual_power_consumed_wh: input.actual_power_consumed_wh ?? null,
      actual_water_consumed_gal: input.actual_water_consumed_gal ?? null,
      actual_weather: input.actual_weather ?? null,
    },
  });
}

export function deleteFieldLog(tripId: string, date: string): Promise<ApiEnvelope<null, DeleteFieldLogMeta>> {
  return request<null, DeleteFieldLogMeta>(`/trips/${tripId}/logs/${encodeURIComponent(date)}`, {
    method: "DELETE",
  });
}
