import "server-only";
import mongoose from "mongoose";
import { getMongoConfig } from "@/lib/config/env.server";
import { HttpError } from "@/lib/http/errors";

type ConnectionCache = { pending: Promise<typeof mongoose> | null };
const globalForMongo = globalThis as typeof globalThis & {
  planMyMarriageMongo?: ConnectionCache;
};
const cache = (globalForMongo.planMyMarriageMongo ??= { pending: null });

export async function connectMongo(): Promise<typeof mongoose> {
  const config = getMongoConfig();
  if (mongoose.connection.readyState === 1) return mongoose;

  if (!cache.pending) {
    cache.pending = mongoose.connect(config.MONGODB_URI, {
      dbName: config.MONGODB_DB_NAME,
      bufferCommands: false,
      autoIndex: process.env.NODE_ENV !== "production",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5_000,
    });
  }

  const pending = cache.pending;
  try {
    return await pending;
  } catch {
    // DNS failures may be plain Node errors, rather than Mongo-prefixed errors.
    // Never expose the underlying error: it can contain the cluster address.
    throw new HttpError(
      503,
      "PROVIDER_UNAVAILABLE",
      "Database service is temporarily unavailable. Please try again later.",
    );
  } finally {
    // Failed attempts can retry; concurrent callers share the same attempt.
    if (cache.pending === pending) cache.pending = null;
  }
}
