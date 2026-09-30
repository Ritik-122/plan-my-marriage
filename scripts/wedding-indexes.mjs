import mongoose from "mongoose";
export async function applyWeddingIndexes(database) {
  await database
    .collection("weddings")
    .createIndex({ slug: 1 }, { unique: true });
  await database.collection("weddings").createIndex({ weddingDate: 1 });
  await database
    .collection("weddingMembers")
    .createIndex({ weddingId: 1, userId: 1 }, { unique: true });
  await database
    .collection("weddingMembers")
    .createIndex({ userId: 1, joinedAt: -1 });
}
if (process.argv.includes("--apply")) {
  try {
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
    await applyWeddingIndexes(mongoose.connection.db);
    console.log("Wedding indexes are ready.");
  } catch {
    console.error(
      "Could not apply wedding indexes. Check configuration, connectivity, and existing duplicate slugs or memberships. No credentials were logged.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
