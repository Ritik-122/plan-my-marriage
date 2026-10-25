import mongoose from "mongoose";
export async function applyPhotoIndexes(db) {
  await db.collection("photos").createIndex({ objectKey: 1 }, { unique: true });
  for (const key of [
    { weddingId: 1, createdAt: -1, _id: -1 },
    { weddingId: 1, eventId: 1, createdAt: -1 },
    { weddingId: 1, purpose: 1, createdAt: -1 },
  ])
    await db.collection("photos").createIndex(key);
  await db
    .collection("photoUploadIntents")
    .createIndex({ objectKey: 1 }, { unique: true });
  await db
    .collection("photoUploadIntents")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}
if (process.argv.includes("--apply")) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    /* Environment may be supplied by deployment. */
  }
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "plan_my_marriage",
      autoIndex: false,
    });
    await applyPhotoIndexes(mongoose.connection.db);
    console.log("Photo indexes are ready.");
  } catch {
    console.error("Could not apply photo indexes. Check database access.");
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
