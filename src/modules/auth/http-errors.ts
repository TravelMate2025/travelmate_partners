import { HttpError } from "@/lib/http-client";

export function isAuthenticationError(error: unknown): boolean {
  return error instanceof HttpError && error.status === 401;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
