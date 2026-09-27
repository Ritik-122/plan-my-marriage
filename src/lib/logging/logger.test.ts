import { expect, it } from "vitest";
import { createLogger } from "./logger";

it("redacts structured secrets and authentication headers", () => {
  let output = "";
  const logger = createLogger({
    write: (line) => {
      output += line;
    },
  });
  logger.info(
    {
      password: "secret-password",
      token: "secret-token",
      MONGODB_URI: "secret-uri",
      payload: { uploadUrl: "secret-upload-url" },
      req: {
        headers: {
          authorization: "Bearer secret-auth",
          cookie: "secret-cookie",
        },
      },
    },
    "safe_event",
  );
  expect(output).toContain("[REDACTED]");
  expect(output).not.toContain("secret-");
  expect(JSON.parse(output).msg).toBe("safe_event");
});
