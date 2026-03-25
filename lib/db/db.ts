import { connect, connection } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

export async function connectDb() {
  if (connection.readyState === 1) return;

  await connect(MONGODB_URI);
}
