import mongoose from "mongoose";

export async function applyAuthIndexes(database) {
  await database
    .collection("users")
    .createIndex({ email: 1 }, { unique: true });
  await database
    .collection("rateLimitBuckets")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

if (process.argv.includes("--apply")) {
  try {
    // Existing process variables (deployment secrets) take precedence.
    try {
      process.loadEnvFile(".env.local");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (!/^mongodb(?:\+srv)?:\/\/\S+$/.test(process.env.MONGODB_URI ?? ""))
      throw new Error();
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "plan_my_marriage",
      autoIndex: false,
      serverSelectionTimeoutMS: 5000,
    });
    await applyAuthIndexes(mongoose.connection.db);
    console.log("Authentication indexes are ready.");
  } catch {
    console.error(
      "Could not apply authentication indexes. Check MongoDB configuration, connectivity, and existing duplicate emails. No credentials were logged.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
