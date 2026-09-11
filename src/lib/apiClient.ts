/**
 * apiClient.ts
 *
 * Central HTTP client for all CI3 backend calls.
 *
 * Usage:
 *   import { api } from '@/lib/apiClient';
 *
 *   // GET
 *   const data = await api.get('/profile');
 *
 *   // POST with body
 *   const result = await api.post('/auth/login', { email, password });
 *
 *   // File upload
 *   const url = await api.upload('/admin/promotions/upload', formData);
 *
 * Auth token is injected automatically from tokenStorage.
 * A 401 response clears the stored token so the app can redirect to /auth.
 */

import { tokenStorage } from "@/lib/tokenStorage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly errors?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost/api/v1";

const INSUFFICIENT_BALANCE_PATTERN =
  /insufficient(?:\s+wallet)?\s+balance|wallet\s+balance\s+(?:is\s+)?insufficient|not\s+enough\s+balance|low\s+balance|wallet\s+balance\s+is\s+too\s+low/i;

function getFriendlyApiMessage(message?: string): string {
  if (!message) {
    return "Request failed";
  }

  if (INSUFFICIENT_BALANCE_PATTERN.test(message)) {
    return "Service temporarily unavailable. Please try again later.";
  }

  return message;
}

function resolveApiErrorMessage(
  message: string | undefined,
  errors?: Record<string, string>,
): string {
  const code = errors?.error_code;

  if (code === "LOCAL_WALLET_INSUFFICIENT") {
    return "Insufficient wallet balance. Please fund your wallet and try again.";
  }

  if (code === "PROVIDER_WALLET_INSUFFICIENT") {
    return "Service temporarily unavailable. Please try again later.";
  }

  return getFriendlyApiMessage(message);
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  const token = tokenStorage.getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  // On 401, clear stored credentials so the app can re-authenticate
  if (response.status === 401) {
    tokenStorage.clear();
  }

  let json: ApiResponse<T>;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("Server returned a non-JSON response", response.status);
  }

  if (!response.ok || !json.success) {
    throw new ApiError(
      resolveApiErrorMessage(json.message, json.errors),
      response.status,
      json.errors,
    );
  }

  return json.data as T;
}

// ---------------------------------------------------------------------------
// Multipart upload (no JSON content-type — let browser set it with boundary)
// ---------------------------------------------------------------------------

async function upload<T = unknown>(
  path: string,
  formData: FormData,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {};
  const token = tokenStorage.getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401) {
    tokenStorage.clear();
  }

  let json: ApiResponse<T>;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError("Server returned a non-JSON response", response.status);
  }

  if (!response.ok || !json.success) {
    throw new ApiError(
      resolveApiErrorMessage(json.message ?? "Upload failed", json.errors),
      response.status,
      json.errors,
    );
  }

  return json.data as T;
}

// ---------------------------------------------------------------------------
// Public API object
// ---------------------------------------------------------------------------

export const api = {
  get: <T = unknown>(path: string) => request<T>("GET", path),

  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>("POST", path, body),

  put: <T = unknown>(path: string, body?: unknown) =>
    request<T>("PUT", path, body),

  del: <T = unknown>(path: string) => request<T>("DELETE", path),

  upload: <T = unknown>(path: string, formData: FormData) =>
    upload<T>(path, formData),
};
