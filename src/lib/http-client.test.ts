import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/lib/http-client";

const fetchMock = vi.fn();

describe("apiRequest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(document, "cookie", {
      configurable: true,
      writable: true,
      value: "",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("adds the CSRF header to unsafe requests when the cookie is present", async () => {
    document.cookie = "csrftoken=test-token";
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ data: {} }),
    });

    await apiRequest("/example", {
      method: "POST",
      body: { hello: "world" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/example",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          "X-CSRFToken": "test-token",
        }),
      }),
    );
  });

  it("does not add the CSRF header to safe requests", async () => {
    document.cookie = "csrftoken=test-token";
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ data: {} }),
    });

    await apiRequest("/example");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/example",
      expect.objectContaining({
        method: "GET",
        headers: expect.not.objectContaining({
          "X-CSRFToken": expect.any(String),
        }),
      }),
    );
  });

  it("does not force json content type for form data bodies", async () => {
    const formData = new FormData();
    formData.set("hello", "world");
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ data: {} }),
    });

    await apiRequest("/example", {
      method: "POST",
      body: formData,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/example",
      expect.objectContaining({
        headers: expect.not.objectContaining({
          "Content-Type": "application/json",
        }),
        body: formData,
      }),
    );
  });

  it("falls back to an HTML title when the backend returns a non-json error page", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "<html><head><title>CSRF verification failed</title></head><body></body></html>",
    });

    await expect(
      apiRequest("/example", {
        method: "POST",
        body: { hello: "world" },
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        message: "CSRF verification failed",
        status: 403,
      }),
    );
  });

  it("reuses CSRF token from response header when cookie is unavailable", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: (name: string) => (name.toLowerCase() === "x-csrftoken" ? "header-token-1" : null) },
        text: async () => JSON.stringify({ data: {} }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        text: async () => JSON.stringify({ data: {} }),
      });

    await apiRequest("/bootstrap-csrf");
    await apiRequest("/unsafe", {
      method: "POST",
      body: { hello: "world" },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/unsafe",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-CSRFToken": "header-token-1",
        }),
      }),
    );
  });
});
