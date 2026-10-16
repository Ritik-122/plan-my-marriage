import mongoose from "mongoose";
export async function applyGuestIndexes(db) {
  await db.collection("guests").createIndex({ weddingId: 1, name: 1, _id: 1 });
  await db
    .collection("guests")
    .createIndex({ weddingId: 1, guestGroupId: 1, name: 1 });
  await db.collection("guests").createIndex({ weddingId: 1, email: 1 });
  await db
    .collection("eventGuests")
    .createIndex({ eventId: 1, guestId: 1 }, { unique: true });
  await db.collection("eventGuests").createIndex({ weddingId: 1, guestId: 1 });
  await db
    .collection("eventGuests")
    .createIndex({ weddingId: 1, eventId: 1, rsvpStatus: 1 });
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
    await applyGuestIndexes(mongoose.connection.db);
    console.log("Guest and event-assignment indexes are ready.");
  } catch {
    console.error(
      "Could not apply guest indexes. Check connectivity and existing duplicate event assignments. No credentials were logged.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
