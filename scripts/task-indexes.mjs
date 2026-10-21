import mongoose from "mongoose";
export async function applyTaskIndexes(db) {
  for (const key of [
    { weddingId: 1, status: 1, dueDate: 1 },
    { weddingId: 1, assignedToUserId: 1, status: 1 },
    { weddingId: 1, eventId: 1, status: 1 },
    { weddingId: 1, _id: -1 },
  ])
    await db.collection("tasks").createIndex(key);
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
    await applyTaskIndexes(mongoose.connection.db);
    console.log("Task indexes are ready.");
  } catch {
    console.error(
      "Could not apply task indexes. Check connectivity. No credentials were logged.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
