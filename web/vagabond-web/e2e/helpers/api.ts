import type { APIRequestContext, APIResponse } from "@playwright/test";

import { TEST_USER_ID } from "./test-data";

type ApiEnv = Partial<
  Record<"PLAYWRIGHT_API_BASE_URL" | "PLAYWRIGHT_SERVER_PORT" | "NEXT_PUBLIC_API_URL", string>
>;

export function resolveApiBaseUrlForEnv(env: ApiEnv): string {
  const explicitPlaywrightBaseUrl = env.PLAYWRIGHT_API_BASE_URL?.trim();
  if (explicitPlaywrightBaseUrl) {
    return explicitPlaywrightBaseUrl.replace(/\/$/, "");
  }

  const playwrightPort = env.PLAYWRIGHT_SERVER_PORT?.trim() || "3101";
  return `http://127.0.0.1:${playwrightPort}`;
}

const API_BASE_URL = resolveApiBaseUrlForEnv({
  PLAYWRIGHT_API_BASE_URL: process.env.PLAYWRIGHT_API_BASE_URL,
  PLAYWRIGHT_SERVER_PORT: process.env.PLAYWRIGHT_SERVER_PORT,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
const API_V1_BASE_URL = `${API_BASE_URL.replace(/\/$/, "")}/api/v1`;

type ApiEnvelope<TData> = {
  data: TData;
  error: { message: string } | null;
};

async function unwrap<TData>(response: APIResponse): Promise<TData> {
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`API request failed (${response.status()}): ${body}`);
  }

  const payload = (await response.json()) as ApiEnvelope<TData>;
  if (payload.error) {
    throw new Error(payload.error.message);
  }
  return payload.data;
}

export async function apiGet<TData>(request: APIRequestContext, path: string): Promise<TData> {
  const response = await request.get(`${API_V1_BASE_URL}${path}`, {
    headers: { "X-Vagabond-User-Id": TEST_USER_ID },
  });
  return unwrap<TData>(response);
}

export async function apiPost<TData>(
  request: APIRequestContext,
  path: string,
  data: unknown,
): Promise<TData> {
  const response = await request.post(`${API_V1_BASE_URL}${path}`, {
    headers: { "X-Vagabond-User-Id": TEST_USER_ID },
    data,
  });
  return unwrap<TData>(response);
}

export async function apiPut<TData>(
  request: APIRequestContext,
  path: string,
  data: unknown,
): Promise<TData> {
  const response = await request.put(`${API_V1_BASE_URL}${path}`, {
    headers: { "X-Vagabond-User-Id": TEST_USER_ID },
    data,
  });
  return unwrap<TData>(response);
}

export async function apiDelete(request: APIRequestContext, path: string): Promise<void> {
  const response = await request.delete(`${API_V1_BASE_URL}${path}`, {
    headers: { "X-Vagabond-User-Id": TEST_USER_ID },
  });
  await unwrap<null>(response);
}
