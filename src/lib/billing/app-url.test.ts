import { describe, it, expect, afterEach, vi } from "vitest";
import { getAppUrl, isTrustedAppOrigin } from "@/lib/billing/stripe";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAppUrl", () => {
  it("uses APP_URL when it is configured", () => {
    vi.stubEnv("APP_URL", "https://fitbuzz-xfab.vercel.app/");
    expect(getAppUrl()).toBe("https://fitbuzz-xfab.vercel.app");
  });

  it("returns the localhost origin for local development", () => {
    vi.stubEnv("APP_URL", "http://localhost:3000");
    expect(getAppUrl()).toBe("http://localhost:3000");
  });

  it("trims surrounding whitespace from APP_URL", () => {
    vi.stubEnv("APP_URL", "  http://localhost:3000  ");
    expect(getAppUrl()).toBe("http://localhost:3000");
  });

  it("falls back to VERCEL_PROJECT_PRODUCTION_URL when APP_URL is missing", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "fitbuzz-xfab.vercel.app");
    vi.stubEnv("VERCEL_URL", "");
    expect(getAppUrl()).toBe("https://fitbuzz-xfab.vercel.app");
  });

  it("falls back to VERCEL_URL when APP_URL and the production URL are missing", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "fitbuzz-abc123.vercel.app");
    expect(getAppUrl()).toBe("https://fitbuzz-abc123.vercel.app");
  });

  it("falls back to localhost when nothing is configured", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getAppUrl()).toBe("http://localhost:3000");
  });

  it("rejects a non-HTTPS APP_URL in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    expect(() => getAppUrl()).toThrow(/HTTPS/);
  });

  it("accepts an HTTPS APP_URL in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://fitbuzz-xfab.vercel.app");
    expect(getAppUrl()).toBe("https://fitbuzz-xfab.vercel.app");
  });

  it("throws for a malformed APP_URL", () => {
    vi.stubEnv("APP_URL", "not a url");
    expect(() => getAppUrl()).toThrow();
  });
});

describe("isTrustedAppOrigin", () => {
  it("accepts an origin that matches the app URL", () => {
    vi.stubEnv("APP_URL", "https://fitbuzz-xfab.vercel.app");
    expect(isTrustedAppOrigin("https://fitbuzz-xfab.vercel.app", getAppUrl())).toBe(true);
  });

  it("rejects the localhost origin when the app runs on Vercel", () => {
    vi.stubEnv("APP_URL", "https://fitbuzz-xfab.vercel.app");
    expect(isTrustedAppOrigin("http://localhost:3000", getAppUrl())).toBe(false);
  });

  it("rejects unknown origins and null origins", () => {
    vi.stubEnv("APP_URL", "http://localhost:3000");
    const appUrl = getAppUrl();
    expect(isTrustedAppOrigin("https://evil.example.com", appUrl)).toBe(false);
    expect(isTrustedAppOrigin(null, appUrl)).toBe(false);
  });
});
