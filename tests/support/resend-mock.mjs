// Loaded only by the isolated integration-test server, never by application code.
import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
if (
  !process.env.MONGODB_URI?.startsWith("mongodb://127.0.0.1:") ||
  process.env.MONGODB_DB_NAME !== "pmm_auth_test"
)
  throw new Error("Disposable database required for email mock.");
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  if (String(url) !== "https://api.resend.com/emails")
    return realFetch(url, options);
  const body = JSON.parse(options.body);
  if (body.to[0].startsWith("timeout-"))
    throw new Error("Mock transport failure");
  if (body.to[0].startsWith("slow-"))
    await new Promise((resolve) => setTimeout(resolve, 1000));
  if (body.to[0].startsWith("failure-"))
    return Response.json(
      { message: "PRIVATE PROVIDER ERROR" },
      { status: 403 },
    );
  const client = new MongoClient(process.env.MONGODB_URI);
  const id = randomUUID();
  try {
    await client.connect();
    await client
      .db("pmm_auth_test")
      .collection("testMailOutbox")
      .insertOne({ ...body, id, createdAt: new Date() });
  } finally {
    await client.close();
  }
  return Response.json({ id });
};
