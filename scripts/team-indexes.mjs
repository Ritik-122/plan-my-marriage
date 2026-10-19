import mongoose from "mongoose";
export async function applyTeamIndexes(db) {
  await db
    .collection("memberInvitations")
    .createIndex({ tokenHash: 1 }, { unique: true });
  await db
    .collection("memberInvitations")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db
    .collection("memberInvitations")
    .createIndex({ weddingId: 1, email: 1, createdAt: -1 });
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
    await applyTeamIndexes(mongoose.connection.db);
    console.log("Team invitation indexes are ready.");
  } catch {
    console.error(
      "Could not apply invitation indexes. Check connectivity and existing token hashes. No credentials were logged.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
