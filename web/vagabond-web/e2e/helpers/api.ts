import type { APIRequestContext, APIResponse } from "@playwright/test";

import { TEST_USER_ID } from "./test-data";

const apiPort = process.env.PLAYWRIGHT_SERVER_PORT ?? "3101";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? `http://127.0.0.1:${apiPort}`;
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
