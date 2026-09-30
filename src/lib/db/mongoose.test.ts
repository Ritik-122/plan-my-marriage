import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  connection: { readyState: 0 },
}));
vi.mock("mongoose", () => ({ default: mocks }));

beforeEach(() => {
  vi.resetModules();
  mocks.connect.mockReset();
  mocks.connection.readyState = 0;
  vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017");
});

describe("lazy MongoDB connection", () => {
  it("does not connect when imported", async () => {
    await import("./mongoose");
    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("shares concurrent connection attempts", async () => {
    mocks.connect.mockResolvedValue(mocks);
    const { connectMongo } = await import("./mongoose");
    await Promise.all([connectMongo(), connectMongo()]);
    expect(mocks.connect).toHaveBeenCalledTimes(1);
  });

  it("allows retry after a failed connection", async () => {
    mocks.connect
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValueOnce(mocks);
    const { connectMongo } = await import("./mongoose");
    await expect(connectMongo()).rejects.toMatchObject({
      status: 503,
      code: "PROVIDER_UNAVAILABLE",
      message:
        "Database service is temporarily unavailable. Please try again later.",
    });
    await expect(connectMongo()).resolves.toBe(mocks);
    expect(mocks.connect).toHaveBeenCalledTimes(2);
  });

  it("reuses an established connection", async () => {
    mocks.connection.readyState = 1;
    const { connectMongo } = await import("./mongoose");
    await expect(connectMongo()).resolves.toBe(mocks);
    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("sanitizes plain DNS errors without leaking connection details", async () => {
    mocks.connect.mockRejectedValueOnce(
      Object.assign(
        new Error("querySrv ECONNREFUSED private-cluster.example"),
        {
          code: "ECONNREFUSED",
          syscall: "querySrv",
        },
      ),
    );
    const { connectMongo } = await import("./mongoose");
    await expect(connectMongo()).rejects.toMatchObject({
      status: 503,
      code: "PROVIDER_UNAVAILABLE",
      message:
        "Database service is temporarily unavailable. Please try again later.",
    });
  });
});
