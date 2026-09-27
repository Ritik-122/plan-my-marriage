import { describe, expect, it } from "vitest";
import { getAppConfig, getMongoConfig } from "./env.server";

describe("capability-aware configuration", () => {
  it("allows the application to run without provider credentials", () => {
    expect(getAppConfig({})).toEqual({
      APP_BASE_URL: "http://localhost:3000",
      LOG_LEVEL: "info",
    });
  });

  it("requires MongoDB configuration only when requested", () => {
    expect(() => getMongoConfig({})).toThrow("MONGODB_URI");
    expect(
      getMongoConfig({ MONGODB_URI: "mongodb://localhost:27017" })
        .MONGODB_DB_NAME,
    ).toBe("plan_my_marriage");
  });

  it("does not leak invalid credential values", () => {
    const secret = "invalid-secret-credential";
    try {
      getMongoConfig({ MONGODB_URI: secret });
      expect.fail("Expected validation failure");
    } catch (error) {
      expect(String(error)).toContain("MONGODB_URI");
      expect(String(error)).not.toContain(secret);
    }
  });

  it("rejects non-HTTP application URLs and invalid log levels", () => {
    expect(() => getAppConfig({ APP_BASE_URL: "javascript:alert(1)" })).toThrow(
      "APP_BASE_URL",
    );
    expect(() => getAppConfig({ LOG_LEVEL: "verbose" })).toThrow("LOG_LEVEL");
  });
});
