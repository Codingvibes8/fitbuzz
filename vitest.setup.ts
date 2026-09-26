import { vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () => undefined,
    set: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn() }),
}));

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  writable: true,
});

vi.stubGlobal("fetch", vi.fn());