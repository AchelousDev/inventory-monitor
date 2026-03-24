/**
 * db.js — connect the app to MongoDB using Mongoose.
 *
 * Why a separate file?
 * - Keeps server.js focused on HTTP routes and middleware.
 * - One place to change connection options or add reconnect logic later.
 * - Easier to read: "open server.js for the API, config/db.js for the database."
 *
 * Mongoose is a library that speaks MongoDB's protocol and gives you schemas,
 * validation, and query helpers on top of plain documents.
 */

import mongoose from "mongoose";

/**
 * connectDB — opens one shared connection for the whole Node process.
 *
 * We use async/await so the caller can wait until MongoDB is ready before
 * accepting HTTP traffic (see server.js). That avoids race errors where the
 * first request hits the API before the database is online.
 *
 * @returns {Promise<void>}
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri === "your_connection_string") {
    console.error(
      "\n[db] Missing or placeholder MONGODB_URI.\n" +
        "Copy backend/.env.example to backend/.env and set a real MongoDB URI.\n"
    );
    throw new Error("MONGODB_URI is not configured.");
  }

  try {
    await mongoose.connect(uri);
    console.log("[db] MongoDB connected successfully.");
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    throw err;
  }
}
