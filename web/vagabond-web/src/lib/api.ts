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

export type CreateTripInput = {
  name: string;
  description?: string | null;
};

export type UpdateTripInput = {
  name: string;
  description?: string | null;
};

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
