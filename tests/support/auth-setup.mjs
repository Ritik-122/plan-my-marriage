import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { applyAuthIndexes } from "../../scripts/auth-indexes.mjs";
import { applyWeddingIndexes } from "../../scripts/wedding-indexes.mjs";
import { applyEventIndexes } from "../../scripts/event-indexes.mjs";
import { applyGuestIndexes } from "../../scripts/guest-indexes.mjs";

export default async function setup() {
  // Never reuse an existing server: it could be connected to a real database.
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(3111, "127.0.0.1", resolve);
  });
  await new Promise((resolve) => probe.close(resolve));
  const mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  let next;
  process.env.PMM_TEST_MONGODB_URI = mongo.getUri();
  async function cleanup() {
    if (next && next.exitCode === null) {
      const exited = new Promise((resolve) => next.once("exit", resolve));
      next.kill();
      await exited;
    }
    await mongoose.disconnect();
    await mongo.stop();
  }
  try {
    await mongoose.connect(mongo.getUri(), {
      dbName: "pmm_auth_test",
      autoIndex: false,
    });
    await applyAuthIndexes(mongoose.connection.db);
    await applyWeddingIndexes(mongoose.connection.db);
    await applyEventIndexes(mongoose.connection.db);
    await applyGuestIndexes(mongoose.connection.db);
    await mongoose.disconnect();
    next = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3111",
      ],
      {
        stdio: "inherit",
        windowsHide: true,
        env: {
          ...process.env,
          NODE_ENV: "production",
          APP_BASE_URL: "http://127.0.0.1:3111",
          MONGODB_URI: mongo.getUri(),
          MONGODB_DB_NAME: "pmm_auth_test",
          SESSION_SECRET: randomBytes(48).toString("base64url"),
          VERCEL: "",
          LOG_LEVEL: "silent",
        },
      },
    );
    for (let attempt = 0; attempt < 100; attempt++) {
      if (next.exitCode !== null)
        throw new Error("Account test server exited before readiness.");
      try {
        if ((await fetch("http://127.0.0.1:3111/api/v1/health")).ok)
          return cleanup;
      } catch {
        /* Wait for startup. */
      }
      await delay(200);
    }
    throw new Error("Account test server did not become ready.");
  } catch (error) {
    await cleanup();
    throw error;
  }
}
