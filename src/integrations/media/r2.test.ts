import { describe, expect, it, vi } from "vitest";
import { getMediaConfig } from "@/lib/config/env.server";
import { presignObject } from "./r2";
const config = {
  APP_BASE_URL: "https://pmm.test",
  R2_ACCOUNT_ID: "a".repeat(32),
  R2_ACCESS_KEY_ID: "fixture-access-key",
  R2_SECRET_ACCESS_KEY: "fixture-secret-key",
  R2_BUCKET_NAME: "pmm-test",
  MEDIA_CDN_BASE_URL: "https://media.pmm.test",
};
describe("photo storage configuration and signing", () => {
  it("requires storage only on demand and rejects unsafe CDN/endpoint configuration", () => {
    expect(() => getMediaConfig({})).toThrow("R2_ACCOUNT_ID");
    expect(getMediaConfig(config).MAX_IMAGE_BYTES).toBe(10485760);
    for (const MEDIA_CDN_BASE_URL of [
      "http://media.pmm.test",
      "https://secret@media.pmm.test",
      "https://media.pmm.test?token=secret",
      "https://media.example.com",
      "data:abc",
    ])
      expect(() => getMediaConfig({ ...config, MEDIA_CDN_BASE_URL })).toThrow();
    expect(() =>
      getMediaConfig({ ...config, R2_ENDPOINT: "http://127.0.0.1:9999" }),
    ).toThrow();
    expect(() =>
      getMediaConfig({
        ...config,
        APP_BASE_URL: "http://localhost:3000",
        VERCEL: "1",
        R2_ENDPOINT: "http://127.0.0.1:9999",
      }),
    ).toThrow();
    expect(
      getMediaConfig({
        ...config,
        APP_BASE_URL: "http://localhost:3000",
        R2_ENDPOINT: "http://127.0.0.1:9999",
      }).endpoint,
    ).toBe("http://127.0.0.1:9999");
  });
  it("signs a short-lived staging PUT with immutable content length, type and create-only condition", async () => {
    for (const [key, value] of Object.entries(config)) vi.stubEnv(key, value);
    vi.stubEnv("R2_ENDPOINT", "");
    const result = await presignObject(
      "staging/wedding/test.png",
      "image/png",
      123,
    );
    const url = new URL(result.uploadUrl);
    expect(url.hostname).toBe(
      `${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    );
    expect(url.pathname).toBe("/pmm-test/staging/wedding/test.png");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(url.searchParams.get("X-Amz-SignedHeaders")?.split(";")).toEqual(
      expect.arrayContaining([
        "content-type",
        "content-length",
        "if-none-match",
      ]),
    );
    expect(result.requiredHeaders).toEqual({
      "Content-Type": "image/png",
      "If-None-Match": "*",
    });
    expect(JSON.stringify(result)).not.toContain(config.R2_SECRET_ACCESS_KEY);
  });
});
