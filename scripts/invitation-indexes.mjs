import mongoose from "mongoose";
export async function applyInvitationIndexes(db) {
  await db
    .collection("guestAccessTokens")
    .createIndex({ tokenHash: 1 }, { unique: true });
  await db
    .collection("guestAccessTokens")
    .createIndex({ weddingId: 1, guestId: 1, createdAt: -1 });
  // Retain expired link metadata for organizers. Access checks enforce expiry.
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
    await applyInvitationIndexes(mongoose.connection.db);
    console.log("Guest invitation indexes are ready.");
  } catch {
    console.error(
      "Could not apply invitation indexes. Check connectivity and existing token hashes. No credentials were logged.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
