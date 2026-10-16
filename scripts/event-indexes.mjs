import mongoose from "mongoose";
export async function applyEventIndexes(database) {
  await database
    .collection("events")
    .createIndex({ weddingId: 1, startsAt: 1 });
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
    await applyEventIndexes(mongoose.connection.db);
    console.log("Event indexes are ready.");
  } catch {
    console.error(
      "Could not apply event indexes. Check database configuration and connectivity. No credentials were logged.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
