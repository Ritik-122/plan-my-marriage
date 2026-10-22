import mongoose from "mongoose";
export async function applyExpenseIndexes(db) {
  for (const key of [
    { weddingId: 1, expenseDate: -1, _id: -1 },
    { weddingId: 1, category: 1 },
    { weddingId: 1, eventId: 1, expenseDate: -1 },
  ])
    await db.collection("expenses").createIndex(key);
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
    await applyExpenseIndexes(mongoose.connection.db);
    console.log("Expense indexes are ready.");
  } catch {
    console.error(
      "Could not apply expense indexes. Check connectivity. No credentials were logged.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
