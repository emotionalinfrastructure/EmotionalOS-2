/**
 * Thin fetch wrapper for the Emotional Infrastructure Governance Runtime
 * API. Every page in this dashboard calls a real backend endpoint through
 * this module -- there are no static/mocked responses here.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }
  return body as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(payload) });
}

export function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(payload) });
}
