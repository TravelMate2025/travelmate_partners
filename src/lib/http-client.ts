import { appConfig } from "@/lib/config";

export class HttpError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

function parseResponsePayload(rawText: string): unknown {
  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return rawText;
  }
}

function extractErrorMessage(payload: unknown, fallbackStatus: number): string {
  if (payload && typeof payload === "object") {
    const data = payload as { message?: string; error?: { message?: string } };
    return data.message ?? data.error?.message ?? `Request failed with status ${fallbackStatus}.`;
  }

  if (typeof payload === "string") {
    const titleMatch = payload.match(/<title>(.*?)<\/title>/i);
    if (titleMatch?.[1]?.trim()) {
      return titleMatch[1].trim();
    }

    const stripped = payload.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (stripped) {
      return stripped;
    }
  }

  return `Request failed with status ${fallbackStatus}.`;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
  timeoutMs?: number;
};

const DEFAULT_REQUEST_TIMEOUT_MS = 20000;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
}

function isUnsafeMethod(method: RequestOptions["method"]): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${appConfig.apiBaseUrl}${path}`;
  const method = options.method ?? "GET";
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
  let requestBody: BodyInit | undefined;
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  if (!isFormDataBody) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (isUnsafeMethod(method)) {
    const csrfToken = readCookie("csrftoken");
    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  if (options.body) {
    requestBody = isFormDataBody ? (options.body as FormData) : JSON.stringify(options.body);
  }

  let response: Response;
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      headers,
      body: requestBody,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new HttpError(
        `Request timed out after ${Math.ceil(timeoutMs / 1000)}s. Please try again.`,
        408,
      );
    }
    throw new HttpError(
      `Unable to reach API at ${appConfig.apiBaseUrl}. Ensure the backend server is running and reachable.`,
      0,
    );
  } finally {
    clearTimeout(timeoutHandle);
  }

  const rawText = await response.text();
  const data = parseResponsePayload(rawText);

  if (!response.ok) {
    throw new HttpError(
      extractErrorMessage(data, response.status),
      response.status,
      data,
    );
  }

  return data as T;
}
