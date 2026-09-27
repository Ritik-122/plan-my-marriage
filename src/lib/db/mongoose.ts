import "server-only";
import mongoose from "mongoose";
import { getMongoConfig } from "@/lib/config/env.server";

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
  } finally {
    // Failed attempts can retry; concurrent callers share the same attempt.
    if (cache.pending === pending) cache.pending = null;
  }
}
