import { vi } from "vitest";

// Next enforces this boundary in application builds; unit tests run in Node.
vi.mock("server-only", () => ({}));
